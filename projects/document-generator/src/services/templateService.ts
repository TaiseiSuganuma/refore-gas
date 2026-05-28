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
