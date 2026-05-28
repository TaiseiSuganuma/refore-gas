// ============================================================
// batchHandler.ts — 複数案件 × 複数書類のバッチ書類生成
// Phase 2: メニュー「書類発行」から呼ばれる
//
// 仕様書根拠:
//   - docs/specification.md § 3「Phase 2 詳細」
//     「行頭チェック ON の案件を抽出 → 各案件について書類列チェック ON のものを順次 PDF 化」
//     「案件フォルダに保存（再出力時は v2, v3... を付与）」
//     「完了後、ステータスを「出力済み」に更新」
//   - docs/specification.md § 8「エラーハンドリング方針」
//     「マスタに必須値が無い → 該当案件のみスキップ + ログに警告」
//     「バッチ完了後にダイアログで「成功 X 件 / 失敗 Y 件 / 詳細リスト」を表示」
//   - docs/master-sheet-schema.md § 2 / § 5 / § 9 / § 10
//
// Phase 2 MVP の制約:
//   - 書類マスタで「有効」=TRUE の書類のみ生成（Phase 1 完成済みの土地売買契約書 1 書類）
//   - 他書類は Phase 3 でテンプレ整備後に「有効」=TRUE 切替で順次対応
//   - 明細繰返し処理は Phase 3 で実装（書類マスタの「明細含む」フラグはまだ未使用）
// ============================================================

namespace BatchHandler {
  // ----------------------------------------------------------
  // 定数
  // ----------------------------------------------------------

  /** Phase 1 で実装済みの書類 ID。これだけは特別扱いで土地売買契約書 Context を組み立てる */
  const DOC_ID_LAND_PURCHASE_CONTRACT = "purchase_contract_land";

  // ----------------------------------------------------------
  // パブリック API
  // ----------------------------------------------------------

  /**
   * メニュー「書類発行」から呼ばれるエントリーポイント。
   *
   * 処理フロー（specification.md § 3「Phase 2 詳細」に基づく）:
   *   1. スプレッドシートと設定を取得
   *   2. 案件一覧から「選択」=TRUE の案件行を抽出
   *   3. 各案件について書類列 ON のもののうち、書類マスタで「有効」=TRUE のものを順次生成
   *   4. 案件フォルダ自動作成 → 同名衝突回避してファイル名決定 → PDF 生成
   *   5. すべて完了したら案件一覧のステータス・フォルダURL・最終出力日時を更新
   *   6. 結果ダイアログを表示
   *
   * @returns BatchResult
   */
  export function generateBatchDocuments(): BatchResult {
    const batchId = Utilities.formatDate(
      new Date(),
      "Asia/Tokyo",
      "yyyyMMdd-HHmmss"
    );
    Logger_.info(`[BatchHandler] バッチ開始: ${batchId}`);

    const result: BatchResult = {
      batchId,
      caseIds: [],
      entries: [],
      successCount: 0,
      failureCount: 0,
      skippedCount: 0,
    };

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 設定読み込み
    let settings: Settings;
    try {
      settings = SheetService.getSettings(ss);
    } catch (err) {
      const msg = `設定シートの読み込みに失敗しました: ${err}`;
      Logger_.error(`[BatchHandler] ${msg}`);
      showErrorAlert_(msg);
      return result;
    }

    const caseSheetName = settings.案件一覧シート名;
    const documentMasterSheetName =
      settings["書類マスタシート名"] || "書類マスタ";
    const selectionColumnName = settings["選択列名"] || "選択";
    const parentFolderId = settings.共通PDF出力先親フォルダID;

    if (!parentFolderId) {
      const msg =
        '設定シートに "共通PDF出力先親フォルダID" が設定されていません。';
      Logger_.error(`[BatchHandler] ${msg}`);
      showErrorAlert_(msg);
      return result;
    }

    // 選択行抽出
    const selectedRows = SheetService.getSelectedCaseRows(
      ss,
      caseSheetName,
      selectionColumnName
    );
    if (selectedRows.length === 0) {
      const msg =
        "「選択」列がチェックされた案件がありません。出力したい案件の選択チェックを ON にしてから「書類発行」を実行してください。";
      Logger_.warn(`[BatchHandler] ${msg}`);
      showErrorAlert_(msg);
      return result;
    }

    Logger_.info(
      `[BatchHandler] 選択案件数: ${selectedRows.length} 件`
    );

    const caseSheet = ss.getSheetByName(caseSheetName);
    if (!caseSheet) {
      const msg = `案件一覧シート "${caseSheetName}" が見つかりません`;
      Logger_.error(`[BatchHandler] ${msg}`);
      showErrorAlert_(msg);
      return result;
    }

    // 各選択案件ごとに処理
    const now = new Date();
    for (const { row: caseRow, rowNumber } of selectedRows) {
      const caseId = String(caseRow.案件ID ?? "").trim();
      result.caseIds.push(caseId);

      // 書類列 ON の書類名を取得
      const checkedDocNames = SheetService.getCheckedDocumentNames(caseRow);
      if (checkedDocNames.length === 0) {
        Logger_.warn(
          `[BatchHandler] 案件 ${caseId}: 書類列が一つも ON ではありません。スキップ`
        );
        result.skippedCount++;
        result.entries.push({
          caseId,
          documentId: "",
          documentName: "",
          success: false,
          message: "書類列が一つも ON ではないためスキップ",
        });
        continue;
      }

      // 案件フォルダを取得（無ければ作成）
      let projectFolder: GoogleAppsScript.Drive.Folder;
      try {
        projectFolder = ProjectFolderService.getOrCreateProjectFolder(
          parentFolderId,
          caseRow
        );
      } catch (err) {
        const msg = `案件フォルダの作成に失敗: ${err}`;
        Logger_.error(`[BatchHandler] 案件 ${caseId}: ${msg}`);
        result.failureCount += checkedDocNames.length;
        for (const docName of checkedDocNames) {
          result.entries.push({
            caseId,
            documentId: "",
            documentName: docName,
            success: false,
            message: msg,
          });
        }
        continue;
      }

      const projectFolderUrl = projectFolder.getUrl();

      // 各書類を生成
      let anySuccess = false;
      for (const docName of checkedDocNames) {
        const entry = generateOneDocument_(
          ss,
          documentMasterSheetName,
          caseRow,
          docName,
          projectFolder,
          settings
        );
        result.entries.push(entry);
        if (entry.success) {
          result.successCount++;
          anySuccess = true;
        } else if (entry.message?.includes("スキップ")) {
          result.skippedCount++;
        } else {
          result.failureCount++;
        }
      }

      // 1 件でも成功したらステータス更新
      if (anySuccess) {
        try {
          SheetService.updateCaseRowStatus(
            caseSheet,
            rowNumber,
            settings["ステータス_出力済み"] || "出力済み",
            projectFolderUrl,
            now
          );
        } catch (err) {
          Logger_.warn(
            `[BatchHandler] 案件 ${caseId}: ステータス更新失敗 (継続): ${err}`
          );
        }
      }
    }

    Logger_.info(
      `[BatchHandler] バッチ完了: ${batchId} — 成功 ${result.successCount} / 失敗 ${result.failureCount} / スキップ ${result.skippedCount}`
    );

    showResultAlert_(result);
    return result;
  }

  // ----------------------------------------------------------
  // プライベートヘルパー
  // ----------------------------------------------------------

  /**
   * 1 案件 × 1 書類を生成する。
   * 書類マスタを引いて有効性確認 → テンプレ ID 抽出 → プレースホルダ Context 生成 → PDF 化。
   */
  function generateOneDocument_(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    documentMasterSheetName: string,
    caseRow: CaseRow,
    documentName: string,
    projectFolder: GoogleAppsScript.Drive.Folder,
    settings: Settings
  ): BatchEntryResult {
    const caseId = String(caseRow.案件ID ?? "").trim();
    const base: BatchEntryResult = {
      caseId,
      documentId: "",
      documentName,
      success: false,
    };

    // 書類マスタから書類定義を引く
    let docDef: DocumentMasterRow | null;
    try {
      docDef = DocumentMasterService.findByName(
        ss,
        documentMasterSheetName,
        documentName
      );
    } catch (err) {
      base.message = `書類マスタの読み込みに失敗: ${err}`;
      Logger_.error(`[BatchHandler] 案件 ${caseId} 書類 ${documentName}: ${base.message}`);
      return base;
    }

    if (!docDef) {
      base.message = `書類マスタに「${documentName}」が見つからないためスキップ`;
      Logger_.warn(`[BatchHandler] 案件 ${caseId}: ${base.message}`);
      return base;
    }

    base.documentId = docDef.書類ID;

    if (!docDef.有効) {
      base.message = `書類マスタで「有効」=FALSE のためスキップ`;
      Logger_.info(`[BatchHandler] 案件 ${caseId} 書類 ${documentName}: ${base.message}`);
      return base;
    }

    // テンプレ Docs ID をテンプレートURLから抽出
    const templateDocId = DocumentMasterService.extractFileIdFromUrl(
      docDef.テンプレートURL
    );
    if (!templateDocId) {
      base.message = `テンプレートURLから Docs ID を抽出できませんでした (URL: "${docDef.テンプレートURL}")`;
      Logger_.error(`[BatchHandler] 案件 ${caseId} 書類 ${documentName}: ${base.message}`);
      return base;
    }

    // プレースホルダ Context を組み立てる
    // Phase 2 では土地売買契約書のみ実装。他書類は Phase 3 で各書類別 Context Builder を追加
    let context: PlaceholderContext;
    try {
      context = buildContextForDocument_(
        ss,
        caseRow,
        docDef.書類ID,
        settings
      );
    } catch (err) {
      base.message = `プレースホルダ Context 生成に失敗: ${err}`;
      Logger_.error(`[BatchHandler] 案件 ${caseId} 書類 ${documentName}: ${base.message}`);
      return base;
    }

    // PDF ファイル名（書類マスタの「ファイル名テンプレ」 or デフォルト命名）
    const pdfFileName = buildPdfFileName_(docDef, caseId, documentName);

    // 同名衝突を避けるため _v2, _v3... を付与
    const uniqueName = VersionedNameService.buildUniqueFileName(
      projectFolder,
      pdfFileName,
      settings["バージョン区切り文字"] || "_v"
    );

    // PDF 生成
    try {
      const pdfFile = TemplateService.generatePdfToFolder(
        templateDocId,
        projectFolder,
        uniqueName,
        context
      );
      base.success = true;
      base.pdfUrl = pdfFile.getUrl();
      Logger_.info(
        `[BatchHandler] 案件 ${caseId} 書類 ${documentName}: PDF 出力成功 → ${uniqueName}`
      );
    } catch (err) {
      base.message = `PDF 生成失敗: ${err}`;
      Logger_.error(`[BatchHandler] 案件 ${caseId} 書類 ${documentName}: ${base.message}`);
    }

    return base;
  }

  /**
   * 書類 ID ごとに適切なプレースホルダ Context を組み立てる。
   *
   * Phase 2 では `purchase_contract_land` のみ実装。
   * Phase 3 着手時に各書類別のビルダー関数を追加していく。
   */
  function buildContextForDocument_(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    caseRow: CaseRow,
    documentId: string,
    settings: Settings
  ): PlaceholderContext {
    if (documentId === DOC_ID_LAND_PURCHASE_CONTRACT) {
      const propertySheetName = settings.物件シート名;
      const caseId = String(caseRow.案件ID ?? "").trim();
      const propertyRows = SheetService.getPropertyRowsByCaseId(
        ss,
        propertySheetName,
        caseId
      );
      const ctx = PlaceholderService.buildLandPurchaseContractContext(
        caseRow,
        propertyRows
      );
      return ctx as unknown as PlaceholderContext;
    }

    // Phase 3 着手時に各書類のビルダーを追加する。
    // それまでは空 Context で PDF 出力（プレースホルダは未差し込みのまま残る）。
    Logger_.warn(
      `[BatchHandler] 書類ID "${documentId}" 用の Context ビルダーが未実装。空 Context で出力します。`
    );
    return {};
  }

  /**
   * PDF ファイル名を組み立てる。
   * 書類マスタの「ファイル名テンプレ」が設定されていればそれを使う。
   * 未設定なら Phase 1 互換の `{案件ID}_{書類名}_{YYYYMMDD}.pdf` を使う。
   *
   * テンプレ記法:
   *   - {{案件ID}}: 案件 ID
   *   - {{今日}}: 当日の YYYYMMDD
   *   - {{書類名}}: 書類名
   */
  function buildPdfFileName_(
    docDef: DocumentMasterRow,
    caseId: string,
    documentName: string
  ): string {
    const today = TemplateService.formatDateToYYYYMMDD(new Date());
    const tpl = String(docDef.ファイル名テンプレ ?? "").trim();

    let stem: string;
    if (tpl) {
      stem = tpl
        .replace(/\{\{案件ID\}\}/g, caseId)
        .replace(/\{\{今日\}\}/g, today)
        .replace(/\{\{書類名\}\}/g, documentName);
    } else {
      stem = `${caseId}_${documentName}_${today}`;
    }
    if (!stem.toLowerCase().endsWith(".pdf")) {
      stem += ".pdf";
    }
    return stem;
  }

  /**
   * バッチ結果のダイアログを表示する。
   * 根拠: specification.md § 8「バッチ完了後にダイアログで「成功 X 件 / 失敗 Y 件 / 詳細リスト」を表示」
   */
  function showResultAlert_(result: BatchResult): void {
    const lines: string[] = [
      `バッチID: ${result.batchId}`,
      `対象案件: ${result.caseIds.length} 件`,
      `成功: ${result.successCount} 件 / 失敗: ${result.failureCount} 件 / スキップ: ${result.skippedCount} 件`,
      "",
    ];

    const maxDetail = 20;
    for (let i = 0; i < Math.min(result.entries.length, maxDetail); i++) {
      const e = result.entries[i];
      const status = e.success ? "✅" : e.message?.includes("スキップ") ? "⏭️" : "❌";
      const detail = e.success ? e.pdfUrl ?? "" : e.message ?? "";
      lines.push(`${status} ${e.caseId} / ${e.documentName} ${detail ? `— ${detail}` : ""}`);
    }
    if (result.entries.length > maxDetail) {
      lines.push(`...（残り ${result.entries.length - maxDetail} 件は Stackdriver ログを参照）`);
    }

    try {
      const ui = SpreadsheetApp.getUi();
      const title =
        result.failureCount === 0
          ? "✅ 書類発行 完了"
          : "⚠️ 書類発行 完了（一部失敗あり）";
      ui.alert(title, lines.join("\n"), ui.ButtonSet.OK);
    } catch (uiErr) {
      Logger_.warn(`[BatchHandler] UI アラート表示に失敗: ${uiErr}`);
    }
  }

  function showErrorAlert_(message: string): void {
    try {
      const ui = SpreadsheetApp.getUi();
      ui.alert("❌ 書類発行エラー", message, ui.ButtonSet.OK);
    } catch (uiErr) {
      Logger_.warn(`[BatchHandler] UI アラート表示に失敗: ${uiErr}`);
    }
  }
}
