namespace SheetService {
  const HEADERS = ["所在", "地番", "地目", "地積（㎡）", "所有者氏名", "取込日時", "ファイル名"];

  // アクティブシートにヘッダーがなければ挿入する
  export function ensureHeaders(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    }
  }

  // 登記情報を最終行に1行追記する
  export function appendRegistryRow(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    data: ParsedRegistry,
    fileName: string
  ): void {
    const now = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");
    const row = [
      data.location,
      data.lotNumber,
      data.landType,
      data.area,
      data.ownerName,
      now,
      fileName,
    ];
    const nextRow = sheet.getLastRow() + 1;
    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
  }

  // 汎用: シートを名前で取得、なければ作成
  export function getOrCreateSheet(
    spreadsheetId: string,
    sheetName: string
  ): GoogleAppsScript.Spreadsheet.Sheet {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    return ss.getSheetByName(sheetName) ?? ss.insertSheet(sheetName);
  }

  // 汎用: まとめて行追記
  export function appendRows(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    rows: unknown[][]
  ): void {
    if (rows.length === 0) return;
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, (rows[0] as unknown[]).length).setValues(rows);
  }
}
