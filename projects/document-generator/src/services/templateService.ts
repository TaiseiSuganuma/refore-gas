// ============================================================
// templateService.ts — Docs テンプレ複製・PDF 化サービス
// Phase 1: 土地売買契約書 MVP
//
// 仕様書根拠:
//   - docs/specification.md § 3「Phase 1 詳細」
//     「テンプレ複製 → プレースホルダ置換 → 指定フォルダに PDF 保存」
//   - docs/specification.md § 4.2「出力（PDF）」
//     ファイル名: {案件ID}_{書類名}_{YYYYMMDD}.pdf
//     保存先: 設定シートで指定したフォルダ (Phase 1)
//   - docs/specification.md § 8「エラーハンドリング方針」
//     一時 Docs はエラー時も finally で削除
// ============================================================

namespace TemplateService {
  // ----------------------------------------------------------
  // 定数
  // ----------------------------------------------------------

  /**
   * PDF 化するために使用する MIME タイプ。
   * 根拠: GAS の DriveApp / Drive Advanced Service 共通の PDF エクスポート MIME。
   */
  const PDF_MIME_TYPE = "application/pdf";

  // ----------------------------------------------------------
  // パブリック API
  // ----------------------------------------------------------

  /**
   * Google Docs テンプレをコピーし、プレースホルダ置換済みの内容で
   * 指定フォルダに PDF として保存する。
   *
   * 処理フロー（specification.md § 3 Phase 1 詳細 に基づく）:
   *   1. テンプレ Docs を Drive 上で複製（一時コピー）
   *   2. 複製した Docs に対してプレースホルダを置換
   *   3. PDF 化して出力先フォルダに保存
   *   4. 一時コピーを削除（finally で必ず実行）
   *
   * @param templateDocId     プレースホルダ挿入済みテンプレの Docs ID
   * @param outputFolderId    出力先フォルダの Drive ID
   * @param caseId            案件ID (ファイル名に使用)
   * @param documentName      書類名 (ファイル名に使用, 例: "土地売買契約書")
   * @param replacements      プレースホルダキー → 置換後文字列のマップ
   * @returns 保存された PDF の DriveFile
   */
  export function generatePdfFromTemplate(
    templateDocId: string,
    outputFolderId: string,
    caseId: string,
    documentName: string,
    replacements: PlaceholderContext
  ): GoogleAppsScript.Drive.File {
    Logger_.info(
      `[TemplateService] 書類生成開始 — 案件ID: ${caseId} / 書類: ${documentName}`
    );

    // 出力ファイル名を生成
    // 根拠: specification.md § 4.2「{案件ID}_{書類名}_{YYYYMMDD}.pdf」
    const dateStr = formatDateToYYYYMMDD_(new Date());
    const pdfFileName = `${caseId}_${documentName}_${dateStr}.pdf`;

    // 出力先フォルダを取得
    const outputFolder = DriveApp.getFolderById(outputFolderId);

    return generatePdfToFolder(
      templateDocId,
      outputFolder,
      pdfFileName,
      replacements
    );
  }

  /**
   * Phase 2 用 — 出力先 Folder と PDF ファイル名を呼び出し側から指定できる版。
   *
   * Phase 2 では batchHandler が ProjectFolderService で案件フォルダを生成し、
   * VersionedNameService で衝突回避済みのファイル名を組み立てた上でこれを呼ぶ。
   *
   * @param templateDocId  プレースホルダ挿入済みテンプレ Docs ID
   * @param outputFolder   出力先 Folder（既に取得済みの DriveApp.Folder）
   * @param pdfFileName    PDF ファイル名（拡張子 .pdf 込み、衝突回避済み）
   * @param replacements   プレースホルダ置換マップ
   * @returns 保存された PDF の DriveFile
   */
  export function generatePdfToFolder(
    templateDocId: string,
    outputFolder: GoogleAppsScript.Drive.Folder,
    pdfFileName: string,
    replacements: PlaceholderContext
  ): GoogleAppsScript.Drive.File {
    Logger_.info(
      `[TemplateService] PDF 生成: ${pdfFileName} → フォルダ ${outputFolder.getName()}`
    );

    // テンプレを複製（一時コピー）
    const originalFile = DriveApp.getFileById(templateDocId);
    const tempCopyName = `[一時コピー]_${pdfFileName}`;
    let tempCopy: GoogleAppsScript.Drive.File | null = null;

    try {
      tempCopy = originalFile.makeCopy(tempCopyName, outputFolder);
      Logger_.info(
        `[TemplateService] 一時コピー作成: ${tempCopy.getId()} (${tempCopyName})`
      );

      // 複製した Docs のプレースホルダを置換
      const tempDoc = DocumentApp.openById(tempCopy.getId());
      // 先に {{#each items}}...{{/each}} ブロックを展開してから単純置換
      // 根拠: placeholder-rules.md § 2「繰返し記法（Phase 3 以降）」
      expandRepeatBlocks_(tempDoc, (replacements as unknown as RepeatableContext).items);
      replaceAllPlaceholders_(tempDoc, replacements);
      tempDoc.saveAndClose();

      // PDF 化して出力先フォルダに保存
      const pdfBlob = exportDocAsPdfBlob_(tempCopy.getId(), pdfFileName);
      const pdfFile = outputFolder.createFile(pdfBlob);

      Logger_.info(
        `[TemplateService] PDF 保存完了: ${pdfFile.getId()} / URL: ${pdfFile.getUrl()}`
      );
      return pdfFile;
    } finally {
      // 根拠: specification.md § 8「一時 Docs はエラー時も finally で削除」
      if (tempCopy !== null) {
        try {
          tempCopy.setTrashed(true);
          Logger_.info(
            `[TemplateService] 一時コピーをゴミ箱へ移動: ${tempCopy.getId()}`
          );
        } catch (cleanupErr) {
          Logger_.warn(
            `[TemplateService] 一時コピー削除に失敗 (無視): ${cleanupErr}`
          );
        }
      }
    }
  }

  // ----------------------------------------------------------
  // 繰返し処理（Phase 3）
  // ----------------------------------------------------------

  /**
   * Docs 本文の {{#each items}} 〜 {{/each}} ブロックを物件件数だけ複製展開する。
   *
   * 根拠:
   *   - placeholder-rules.md § 2「繰返し記法（Phase 3 以降）」
   *   - documents/legal_documents_placeholders.md「不動産の表示（繰返し処理 Phase 3）」
   *
   * 動作:
   *   - 開始マーカー段落「{{#each items}}」と終了マーカー段落「{{/each}}」を本文から検出
   *   - 開始〜終了の間の段落（本体テンプレート）を、items.length 件分複製
   *   - 複製した各段落の `{{key}}` を items[i] の対応値で置換
   *   - マーカー段落（開始・終了）は削除
   *
   * 制約:
   *   - マーカー段落は単独の段落として書く（同じ段落に他のテキスト混在は非対応）
   *   - ネストはサポートしない
   *
   * @param doc   置換対象の Docs
   * @param items 繰返し展開する辞書配列。undefined または空配列ならマーカー段落だけ削除
   */
  function expandRepeatBlocks_(
    doc: GoogleAppsScript.Document.Document,
    items: Array<{ [key: string]: string }> | undefined
  ): void {
    const body = doc.getBody();
    const startMarker = "{{#each items}}";
    const endMarker = "{{/each}}";

    // 同一文書に複数の {{#each}} がある可能性は Phase 3 では想定外。1 回検出して処理し終わったらループ脱出
    for (let safety = 0; safety < 10; safety++) {
      const range = findMarkerRange_(body, startMarker, endMarker);
      if (!range) return;

      const { startIdx, endIdx } = range;

      // 開始〜終了の間にある段落をテンプレートとして抜き出す（インデックスはコピー）
      const templateParagraphs: GoogleAppsScript.Document.Paragraph[] = [];
      for (let i = startIdx + 1; i < endIdx; i++) {
        templateParagraphs.push(body.getChild(i).asParagraph());
      }

      // items が空 or undefined ならマーカーと本体段落をすべて削除
      if (!items || items.length === 0) {
        for (let i = endIdx; i >= startIdx; i--) {
          body.removeChild(body.getChild(i));
        }
        Logger_.info(
          `[TemplateService] 繰返しブロックを削除（items 空）`
        );
        continue;
      }

      // 終了マーカー段落の直後に items.length 件分の複製を挿入する
      // 元のテンプレ段落 + マーカー2件はあとで削除
      let insertAt = endIdx + 1;
      for (const item of items) {
        for (const tp of templateParagraphs) {
          const copyText = tp.copy();
          body.insertParagraph(insertAt, copyText.getText());
          // copy() ではスタイルを引き継いだ Paragraph の挿入はしない簡易実装
          // Phase 3 では装飾不要なテキストのみのテンプレ前提
          const inserted = body.getChild(insertAt).asParagraph();
          // インライン置換
          for (const key of Object.keys(item)) {
            inserted.replaceText(`{{${key}}}`, item[key] ?? "");
          }
          insertAt++;
        }
      }

      // 元のテンプレ段落 + マーカー2件を削除（後ろから消すと index がずれない）
      for (let i = endIdx; i >= startIdx; i--) {
        body.removeChild(body.getChild(i));
      }

      Logger_.info(
        `[TemplateService] 繰返しブロックを ${items.length} 件分展開`
      );
    }
  }

  /**
   * 本文から {{#each items}} と {{/each}} の段落インデックスを検出する。
   * 見つからない場合は null。
   */
  function findMarkerRange_(
    body: GoogleAppsScript.Document.Body,
    startMarker: string,
    endMarker: string
  ): { startIdx: number; endIdx: number } | null {
    const numChildren = body.getNumChildren();
    let startIdx = -1;
    let endIdx = -1;
    for (let i = 0; i < numChildren; i++) {
      const child = body.getChild(i);
      if (child.getType() !== DocumentApp.ElementType.PARAGRAPH) continue;
      const text = child.asParagraph().getText();
      if (startIdx < 0 && text.indexOf(startMarker) >= 0) {
        startIdx = i;
      } else if (startIdx >= 0 && text.indexOf(endMarker) >= 0) {
        endIdx = i;
        break;
      }
    }
    if (startIdx < 0 || endIdx < 0) return null;
    return { startIdx, endIdx };
  }

  // ----------------------------------------------------------
  // プライベートヘルパー
  // ----------------------------------------------------------

  /**
   * Google Docs ドキュメント内のすべてのプレースホルダを置換する。
   *
   * GAS の Body.replaceText() を使用して本文全体を一括置換する。
   * ヘッダー・フッターも対象とする。
   *
   * 根拠: placeholder-rules.md § 1「{{key}} → マスタシートの値で置換」
   *   「{{key}}」形式のプレースホルダのみ対象（Phase 1 は値差し込みのみ）
   *
   * @param doc          置換対象の DocumentApp.Document
   * @param replacements キー → 置換後文字列のマップ（キーは `{{key}}` のキー部分）
   */
  function replaceAllPlaceholders_(
    doc: GoogleAppsScript.Document.Document,
    replacements: PlaceholderContext
  ): void {
    const body = doc.getBody();

    for (const key of Object.keys(replacements)) {
      // GAS の replaceText は正規表現パターンを受け取る
      // `{`, `}` は正規表現の特殊文字ではないが念のためエスケープしない
      // （GAS では `replaceText` の第1引数は正規表現文字列として扱われるため、
      //   `{{key}}` に含まれる `{` と `}` は正規表現上は問題ない — 量指定子の後ではないため）
      const placeholder = `{{${key}}}`;
      const replacement = replacements[key] ?? "";

      body.replaceText(placeholder, replacement);
      Logger_.info(
        `[TemplateService] 置換: "${placeholder}" → "${replacement}"`
      );
    }

    // ヘッダーセクションの置換
    const headerSection = doc.getHeader();
    if (headerSection) {
      for (const key of Object.keys(replacements)) {
        headerSection.replaceText(`{{${key}}}`, replacements[key] ?? "");
      }
    }

    // フッターセクションの置換
    const footerSection = doc.getFooter();
    if (footerSection) {
      for (const key of Object.keys(replacements)) {
        footerSection.replaceText(`{{${key}}}`, replacements[key] ?? "");
      }
    }
  }

  /**
   * Google Docs ファイルを PDF として Blob にエクスポートする。
   *
   * DriveApp の URL エクスポート方式を使用する。
   * 根拠: GAS 標準の PDF エクスポート方法 (clasp push 不要・UrlFetchApp 利用)
   *
   * @param docId    エクスポートする Docs の File ID
   * @param blobName 生成する Blob に付ける名前
   * @returns PDF の Blob
   */
  function exportDocAsPdfBlob_(
    docId: string,
    blobName: string
  ): GoogleAppsScript.Base.Blob {
    // Google Docs の PDF エクスポート URL
    // UrlFetchApp でスクリプトのサービスアカウントとして取得する
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=pdf`;

    const token = ScriptApp.getOAuthToken();
    const response = UrlFetchApp.fetch(exportUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      muteHttpExceptions: true,
    });

    if (response.getResponseCode() !== 200) {
      throw new Error(
        `[TemplateService] PDF エクスポート失敗: HTTP ${response.getResponseCode()} — ${response.getContentText().slice(0, 200)}`
      );
    }

    return response.getBlob().setName(blobName);
  }

  /**
   * Date を YYYYMMDD 形式の文字列に変換する。
   * 根拠: specification.md § 4.2「{案件ID}_{書類名}_{YYYYMMDD}.pdf」
   *
   * @param date 変換対象の Date
   * @returns "YYYYMMDD" 形式の文字列
   */
  export function formatDateToYYYYMMDD(date: Date): string {
    return formatDateToYYYYMMDD_(date);
  }

  function formatDateToYYYYMMDD_(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
  }
}
