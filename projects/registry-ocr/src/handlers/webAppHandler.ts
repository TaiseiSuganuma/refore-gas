// このプロジェクトでは Web アプリとしての doGet/doPost は使用しない。
// ダイアログ UI は HtmlService + google.script.run で実装する。
// テンプレートとの互換性のためファイルを残す。
namespace WebAppHandler {
  export function handleGet(_e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
    return HtmlService.createHtmlOutput("<p>このアプリはスプレッドシートのメニューから起動してください。</p>")
      .setTitle("不動産登記 OCR");
  }

  export function handlePost(_e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
    const res: WebAppResponse = { status: "error", message: "未使用のエンドポイントです" };
    return ContentService.createTextOutput(JSON.stringify(res))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
