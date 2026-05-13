// GASのグローバルエントリーポイント。このファイルの関数はGASから直接呼ばれる。

function main(): void {
  Logger_.info("main() called");
  console.log("Hello from GAS main()");
}

function onOpen(): void {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("カスタムメニュー")
    .addItem("実行", "main")
    .addToUi();
}

function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
  return WebAppHandler.handleGet(e);
}

function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  return WebAppHandler.handlePost(e);
}
