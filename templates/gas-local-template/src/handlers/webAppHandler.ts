namespace WebAppHandler {
  export function handleGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
    const page = e.parameter["page"] ?? "index";
    Logger_.info("doGet called", { page });

    const html = `<!DOCTYPE html>
<html>
  <head><meta charset="utf-8"><title>GAS Web App</title></head>
  <body>
    <h1>Hello from GAS</h1>
    <p>page: ${escapeHtml(page)}</p>
  </body>
</html>`;

    return HtmlService.createHtmlOutput(html)
      .setTitle("GAS Web App")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  export function handlePost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
    Logger_.info("doPost called");

    try {
      const body = JSON.parse(e.postData?.contents ?? "{}") as Record<string, unknown>;
      Logger_.info("request body", body);

      const response: WebAppResponse = { status: "success", data: body };
      return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      Logger_.error("doPost parse error", err);
      const response: WebAppResponse = { status: "error", message: "Invalid JSON" };
      return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
