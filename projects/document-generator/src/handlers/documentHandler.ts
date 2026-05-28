// ============================================================
// documentHandler.ts — 単発書類生成オーケストレーション
// Phase 1: 土地売買契約書 MVP
//
// 仕様書根拠:
//   - docs/specification.md § 3「Phase 1 詳細」
//     「案件一覧シートからアクティブ行を選び、土地売買契約書 1 書類を PDF 出力」
//     処理順: アクティブ行取得 → 物件行取得 → 設定取得 → プレースホルダ生成 → PDF 保存
//   - docs/specification.md § 8「エラーハンドリング方針」
//     「マスタに必須値が無い → 該当案件のみスキップ + ログに警告」
//     「一時 Docs はエラー時も finally で削除（TemplateService が担当）」
//   - docs/specification.md § 11「関連ファイル一覧」
//     「documentHandler.ts: 単発書類生成オーケストレーション（Phase 1）」
// ============================================================

namespace DocumentHandler {
  // ----------------------------------------------------------
  // 定数
  // ----------------------------------------------------------

  /**
   * 土地売買契約書の書類名（PDF ファイル名に使用）。
   * 根拠: specification.md § 4.2「{案件ID}_{書類名}_{YYYYMMDD}.pdf」
   */
  const LAND_PURCHASE_CONTRACT_NAME = "土地売買契約書";

  // ----------------------------------------------------------
  // パブリック API
  // ----------------------------------------------------------

  /**
   * 土地売買契約書を単発生成するメインエントリーポイント。
   *
   * 処理フロー（specification.md § 3 Phase 1 詳細 に基づく）:
   *   1. スプレッドシートと設定を取得
   *   2. アクティブ行（案件一覧シート）の案件データを取得
   *   3. 物件シートから案件 ID に紐づく物件データを取得
   *   4. プレースホルダコンテキストを生成（placeholderService）
   *   5. テンプレから PDF 生成・保存（templateService）
   *   6. 結果をユーザーに通知（UI アラート）
   *
   * @returns DocumentGenerationResult
   */
  export function generateLandPurchaseContract(): DocumentGenerationResult {
    Logger_.info("[DocumentHandler] 土地売買契約書 生成開始");

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 設定シートを読み込む
    // 根拠: master-sheet-schema.md § 4「設定シート」
    let settings: Settings;
    try {
      settings = SheetService.getSettings(ss);
    } catch (err) {
      const msg = `設定シートの読み込みに失敗しました: ${err}`;
      Logger_.error(`[DocumentHandler] ${msg}`);
      showErrorAlert_(msg);
      return {
        success: false,
        errorMessage: msg,
        caseId: "",
        documentName: LAND_PURCHASE_CONTRACT_NAME,
      };
    }

    // テンプレ ID と出力フォルダ ID の存在確認
    // 根拠: specification.md § 8「マスタに必須値が無い → 該当案件のみスキップ + ログに警告」
    const templateDocId = settings.Phase1テンプレID_土地売買契約書;
    const outputFolderId = settings.共通PDF出力先親フォルダID;

    if (!templateDocId) {
      const msg =
        '設定シートに "Phase1テンプレID_土地売買契約書" が設定されていません。設定シートを確認してください。';
      Logger_.error(`[DocumentHandler] ${msg}`);
      showErrorAlert_(msg);
      return {
        success: false,
        errorMessage: msg,
        caseId: "",
        documentName: LAND_PURCHASE_CONTRACT_NAME,
      };
    }

    if (!outputFolderId) {
      const msg =
        '設定シートに "共通PDF出力先親フォルダID" が設定されていません。設定シートを確認してください。';
      Logger_.error(`[DocumentHandler] ${msg}`);
      showErrorAlert_(msg);
      return {
        success: false,
        errorMessage: msg,
        caseId: "",
        documentName: LAND_PURCHASE_CONTRACT_NAME,
      };
    }

    // アクティブ行（案件一覧シート）から案件データを取得
    // 根拠: specification.md § 3「案件一覧シートからアクティブ行を選び」
    const caseSheetName = settings.案件一覧シート名;
    let caseRow: CaseRow | null;
    try {
      caseRow = SheetService.getActiveCaseRow(ss, caseSheetName);
    } catch (err) {
      const msg = `案件一覧シートの読み込みに失敗しました: ${err}`;
      Logger_.error(`[DocumentHandler] ${msg}`);
      showErrorAlert_(msg);
      return {
        success: false,
        errorMessage: msg,
        caseId: "",
        documentName: LAND_PURCHASE_CONTRACT_NAME,
      };
    }

    if (!caseRow) {
      const msg =
        '案件一覧シートのデータ行（2行目以降）を選択した状態で「土地売買契約書」を実行してください。';
      Logger_.warn(`[DocumentHandler] ${msg}`);
      showErrorAlert_(msg);
      return {
        success: false,
        errorMessage: msg,
        caseId: "",
        documentName: LAND_PURCHASE_CONTRACT_NAME,
      };
    }

    const caseId = String(caseRow.案件ID ?? "").trim();
    Logger_.info(`[DocumentHandler] 対象案件: ${caseId}`);

    // 案件 ID の基本バリデーション
    if (!caseId) {
      const msg = "選択した行の案件IDが空です。正しい案件行を選択してください。";
      Logger_.error(`[DocumentHandler] ${msg}`);
      showErrorAlert_(msg);
      return {
        success: false,
        errorMessage: msg,
        caseId: "",
        documentName: LAND_PURCHASE_CONTRACT_NAME,
      };
    }

    // 物件シートから案件 ID に紐づく物件行を取得
    // 根拠: specification.md § 4.1「物件シート（アクティブ行 1 件）」
    const propertySheetName = settings.物件シート名;
    let propertyRows: PropertyRow[];
    try {
      propertyRows = SheetService.getPropertyRowsByCaseId(
        ss,
        propertySheetName,
        caseId
      );
    } catch (err) {
      const msg = `物件シートの読み込みに失敗しました: ${err}`;
      Logger_.error(`[DocumentHandler] ${msg}`);
      showErrorAlert_(msg);
      return {
        success: false,
        errorMessage: msg,
        caseId,
        documentName: LAND_PURCHASE_CONTRACT_NAME,
      };
    }

    if (propertyRows.length === 0) {
      // 物件データがない場合は警告ログを出して処理継続（プレースホルダは空になる）
      // 根拠: specification.md § 8「テンプレのプレースホルダがマスタに無い → 警告ログ + 処理継続」
      Logger_.warn(
        `[DocumentHandler] 案件 ${caseId} の物件シートにデータがありません。地積・筆数・所在等が空になります。`
      );
    }

    // プレースホルダコンテキストを生成
    // 根拠: specification.md § 3「プレースホルダ置換」
    let context: LandPurchaseContractContext;
    try {
      context = PlaceholderService.buildLandPurchaseContractContext(
        caseRow,
        propertyRows
      );
    } catch (err) {
      const msg = `プレースホルダの生成に失敗しました: ${err}`;
      Logger_.error(`[DocumentHandler] ${msg}`);
      showErrorAlert_(msg);
      return {
        success: false,
        errorMessage: msg,
        caseId,
        documentName: LAND_PURCHASE_CONTRACT_NAME,
      };
    }

    // テンプレから PDF を生成・出力フォルダに保存
    // 根拠: specification.md § 3「指定フォルダに PDF 保存」
    let pdfFile: GoogleAppsScript.Drive.File;
    try {
      pdfFile = TemplateService.generatePdfFromTemplate(
        templateDocId,
        outputFolderId,
        caseId,
        LAND_PURCHASE_CONTRACT_NAME,
        context as unknown as PlaceholderContext
      );
    } catch (err) {
      const msg = `PDF の生成に失敗しました: ${err}`;
      Logger_.error(`[DocumentHandler] ${msg}`);
      showErrorAlert_(msg);
      return {
        success: false,
        errorMessage: msg,
        caseId,
        documentName: LAND_PURCHASE_CONTRACT_NAME,
      };
    }

    // 完了通知
    const pdfUrl = pdfFile.getUrl();
    Logger_.info(
      `[DocumentHandler] 土地売買契約書 生成完了 — 案件ID: ${caseId} / PDF URL: ${pdfUrl}`
    );
    showSuccessAlert_(caseId, pdfUrl);

    return {
      success: true,
      pdfFileId: pdfFile.getId(),
      pdfUrl,
      caseId,
      documentName: LAND_PURCHASE_CONTRACT_NAME,
    };
  }

  // ----------------------------------------------------------
  // プライベートヘルパー
  // ----------------------------------------------------------

  /**
   * 書類生成成功時のアラートを表示する。
   *
   * 根拠: specification.md § 3「Phase 1 詳細」には明示なし。
   * ユーザーが操作したタイミングで結果を知るために UI アラートを表示する（標準的な GAS の UX）。
   *
   * @param caseId  案件ID
   * @param pdfUrl  生成された PDF の URL
   */
  function showSuccessAlert_(caseId: string, pdfUrl: string): void {
    try {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        "✅ 書類生成完了",
        `案件ID: ${caseId}\n書類: 土地売買契約書\n\nPDF が出力フォルダに保存されました。\nURL: ${pdfUrl}`,
        ui.ButtonSet.OK
      );
    } catch (uiErr) {
      // UI が利用できない環境（バッチ実行など）ではログのみ
      Logger_.warn(`[DocumentHandler] UI アラート表示に失敗: ${uiErr}`);
    }
  }

  /**
   * エラー発生時のアラートを表示する。
   *
   * @param message  ユーザーに表示するエラーメッセージ
   */
  function showErrorAlert_(message: string): void {
    try {
      const ui = SpreadsheetApp.getUi();
      ui.alert(
        "❌ 書類生成エラー",
        message,
        ui.ButtonSet.OK
      );
    } catch (uiErr) {
      Logger_.warn(`[DocumentHandler] UI アラート表示に失敗: ${uiErr}`);
    }
  }
}
