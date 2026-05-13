namespace SheetService {
  // シートを名前で取得する。存在しない場合は新規作成する。
  export function getOrCreateSheet(spreadsheetId: string, sheetName: string): GoogleAppsScript.Spreadsheet.Sheet {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    return ss.getSheetByName(sheetName) ?? ss.insertSheet(sheetName);
  }

  // シート全体のデータを2次元配列で取得する。
  export function getAllRows(sheet: GoogleAppsScript.Spreadsheet.Sheet): unknown[][] {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow === 0 || lastCol === 0) return [];
    return sheet.getRange(1, 1, lastRow, lastCol).getValues();
  }

  // ヘッダー行を除いたデータ行を SheetRow[] として返す。
  export function getDataRows(sheet: GoogleAppsScript.Spreadsheet.Sheet): SheetRow[] {
    const all = getAllRows(sheet);
    if (all.length < 2) return [];
    const headers = all[0] as string[];
    return all.slice(1).map((row) => {
      const record: SheetRow = {};
      headers.forEach((h, i) => {
        record[h] = row[i] as string | number | boolean | Date;
      });
      return record;
    });
  }

  // 複数行をまとめてシート末尾に追記する。
  export function appendRows(sheet: GoogleAppsScript.Spreadsheet.Sheet, rows: unknown[][]): void {
    if (rows.length === 0) return;
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
  }
}
