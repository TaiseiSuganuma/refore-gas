namespace RegistryHandler {
  // フロントエンドから呼ばれるメインエントリー
  export function processUpload(payload: UploadPayload): ProcessResult {
    Logger_.info("processUpload start", { fileName: payload.fileName });

    try {
      validatePayload(payload);

      const text = OcrService.extractTextFromPdfBase64(payload.base64, payload.fileName);

      if (!text || text.trim().length === 0) {
        throw new Error("OCR でテキストを抽出できませんでした。PDFが画像のみで構成されているか、読み取り不可能な形式の可能性があります。");
      }

      Logger_.info("OCR text sample", { sample: text.substring(0, 200) });

      const parsed = RegistryParser.parse(text);
      Logger_.info("parsed result", parsed);

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName("抽出結果") ?? ss.insertSheet("抽出結果");
      SheetService.ensureHeaders(sheet);
      SheetService.appendRegistryRow(sheet, parsed, payload.fileName);

      Logger_.info("processUpload done");
      return {
        success: true,
        message: "登記情報をシートに追記しました。",
        data: parsed,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Logger_.error("processUpload failed", msg);
      return { success: false, message: msg };
    }
  }

  function validatePayload(payload: UploadPayload): void {
    if (!payload.base64 || payload.base64.trim() === "") {
      throw new Error("ファイルデータが空です。");
    }
    if (payload.mimeType !== "application/pdf") {
      throw new Error(`PDF ファイルのみ対応しています（受信した形式: ${payload.mimeType}）`);
    }
    // Base64 サイズ概算（約 15MB 上限）
    const approxBytes = (payload.base64.length * 3) / 4;
    if (approxBytes > 15 * 1024 * 1024) {
      throw new Error("ファイルサイズが大きすぎます（上限 15MB）。");
    }
  }
}
