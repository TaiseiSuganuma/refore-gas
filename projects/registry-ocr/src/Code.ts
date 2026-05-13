// GASのグローバルエントリーポイント。GASランタイムから直接呼ばれる関数のみここに置く。

function onOpen(): void {
  SpreadsheetApp.getUi()
    .createMenu("不動産登記 OCR")
    .addItem("PDFを取り込む", "openUploadDialog")
    .addToUi();
}

// カスタムダイアログを開く
function openUploadDialog(): void {
  const html = HtmlService.createHtmlOutputFromFile("dialog")
    .setWidth(520)
    .setHeight(480);
  SpreadsheetApp.getUi().showModalDialog(html, "不動産登記PDF 取り込み");
}

// フロントエンド (google.script.run) から呼ばれる
function processRegistryPdf(payload: UploadPayload): ProcessResult {
  return RegistryHandler.processUpload(payload);
}

// テンプレート互換
function main(): void {
  Logger_.info("main() called");
}

function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
  return WebAppHandler.handleGet(e);
}

function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  return WebAppHandler.handlePost(e);
}
