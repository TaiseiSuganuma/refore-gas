// ============================================================
// Code.ts — GAS グローバルエントリーポイント
// Phase 1: 土地売買契約書 MVP
//
// 仕様書根拠:
//   - docs/specification.md § 3「Phase 1 詳細」
//     「メニュー「書類出力」→「土地売買契約書」項目で実行」
//   - docs/specification.md § 11「関連ファイル一覧」
//     「src/Code.ts: GAS グローバル関数（onOpen, generateLandPurchaseContract, ...）」
//
// 注意: このファイルのグローバル関数（onOpen, main, doGet, doPost）は
//   GAS から直接呼ばれるため、削除・改名禁止（CLAUDE.md 参照）。
// ============================================================

function main(): void {
  Logger_.info("main() called");
  console.log("Hello from GAS main()");
}

/**
 * スプレッドシートを開いたときにカスタムメニューを設定する。
 *
 * 根拠: specification.md § 3「Phase 1 詳細」
 *   「メニュー「書類出力」→「土地売買契約書」項目で実行」
 */
function onOpen(): void {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("書類出力")
    .addItem("土地売買契約書", "generateLandPurchaseContract")
    .addToUi();
}

/**
 * 「書類出力」→「土地売買契約書」メニューから呼ばれるグローバルエントリーポイント。
 *
 * 案件一覧シートのアクティブ行（選択中の行）を使い、
 * 土地売買契約書 1 書類を PDF 出力する。
 * 実処理は DocumentHandler.generateLandPurchaseContract() に委譲。
 *
 * 根拠: specification.md § 3「Phase 1 詳細」手順 4
 *   「メニュー「書類出力」→「土地売買契約書」項目で実行」
 */
function generateLandPurchaseContract(): void {
  DocumentHandler.generateLandPurchaseContract();
}

function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
  return WebAppHandler.handleGet(e);
}

function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  return WebAppHandler.handlePost(e);
}
