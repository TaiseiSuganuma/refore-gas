// ============================================================
// Code.ts — GAS グローバルエントリーポイント
// Phase 1: 土地売買契約書 MVP (単発生成)
// Phase 2: 書類発行バッチ + onEdit による書類自動チェック投入
//
// 仕様書根拠:
//   - docs/specification.md § 3「Phase 1 詳細」「Phase 2 詳細」
//   - docs/specification.md § 11「関連ファイル一覧」
//
// 注意: このファイルのグローバル関数（onOpen, main, doGet, doPost, onEdit）は
//   GAS から直接呼ばれるため、削除・改名禁止（CLAUDE.md 参照）。
// ============================================================

function main(): void {
  Logger_.info("main() called");
  console.log("Hello from GAS main()");
}

/**
 * スプレッドシートを開いたときにカスタムメニューを設定する。
 *
 * 根拠:
 *   - specification.md § 3「Phase 1 詳細」: メニュー「書類出力」→「土地売買契約書」
 *   - specification.md § 3「Phase 2 詳細」: メニュー「書類発行」→ バッチ処理
 */
function onOpen(): void {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("書類出力")
    .addItem("土地売買契約書（単発・Phase 1）", "generateLandPurchaseContract")
    .addSeparator()
    .addItem("書類発行（バッチ・Phase 2）", "generateBatchDocuments")
    .addToUi();
}

/**
 * 「書類出力」→「土地売買契約書」メニューから呼ばれるグローバルエントリーポイント。
 *
 * 案件一覧シートのアクティブ行（選択中の行）を使い、
 * 土地売買契約書 1 書類を PDF 出力する。
 *
 * 根拠: specification.md § 3「Phase 1 詳細」手順 4
 */
function generateLandPurchaseContract(): void {
  DocumentHandler.generateLandPurchaseContract();
}

/**
 * 「書類出力」→「書類発行（バッチ・Phase 2）」メニューから呼ばれる。
 *
 * 案件一覧シートの「選択」列が ON の案件について、
 * 書類列 ON のもののうち書類マスタで「有効」=TRUE のものを順次 PDF 化する。
 *
 * 根拠: specification.md § 3「Phase 2 詳細」
 */
function generateBatchDocuments(): void {
  BatchHandler.generateBatchDocuments();
}

/**
 * 案件パターン列が編集されたときに、書類マスタの対応パターンを参照して
 * 書類列を自動 TRUE にする（簡易インストール型 onEdit トリガー）。
 *
 * 注意: シンプルトリガー (onEdit) は権限制約があるため、
 * 必要に応じてユーザーが「拡張機能 → Apps Script → トリガー」で
 * インストール型トリガーに変更する。
 *
 * 根拠: master-sheet-schema.md § 2「初期チェック投入ロジック」
 */
function onEdit(e: GoogleAppsScript.Events.SheetsOnEdit): void {
  OnEditHandler.handleEdit(e);
}

function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput {
  return WebAppHandler.handleGet(e);
}

function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
  return WebAppHandler.handlePost(e);
}
