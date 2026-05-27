// ============================================================
// sheetService.ts — シート読み込みユーティリティ
// Phase 1: 案件一覧・物件・設定シートの読み込み
//
// 仕様書根拠:
//   - docs/master-sheet-schema.md § 2 (案件一覧シート Phase 1 段階)
//   - docs/master-sheet-schema.md § 3 (物件シート)
//   - docs/master-sheet-schema.md § 4 (設定シート)
//   - docs/specification.md § 4.1 (入力仕様: アクティブ行 1 件)
// ============================================================

namespace SheetService {
  // ----------------------------------------------------------
  // 汎用ユーティリティ
  // ----------------------------------------------------------

  /** シートを名前で取得する。存在しない場合は新規作成する。 */
  export function getOrCreateSheet(
    spreadsheetId: string,
    sheetName: string
  ): GoogleAppsScript.Spreadsheet.Sheet {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    return ss.getSheetByName(sheetName) ?? ss.insertSheet(sheetName);
  }

  /** シート全体のデータを2次元配列で取得する。 */
  export function getAllRows(
    sheet: GoogleAppsScript.Spreadsheet.Sheet
  ): unknown[][] {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow === 0 || lastCol === 0) return [];
    return sheet.getRange(1, 1, lastRow, lastCol).getValues();
  }

  /**
   * ヘッダー行を除いたデータ行を SheetRow[] として返す。
   * 根拠: 案件一覧・物件シートともに 1 行目がヘッダー行 (master-sheet-schema.md § 2, § 3)
   */
  export function getDataRows(
    sheet: GoogleAppsScript.Spreadsheet.Sheet
  ): SheetRow[] {
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

  /** 複数行をまとめてシート末尾に追記する。 */
  export function appendRows(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    rows: unknown[][]
  ): void {
    if (rows.length === 0) return;
    const startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
  }

  // ----------------------------------------------------------
  // Phase 1 固有: 設定シート
  // 根拠: master-sheet-schema.md § 4「設定シート」
  // ----------------------------------------------------------

  /**
   * 設定シートから Settings オブジェクトを生成して返す。
   * A 列: 項目（キー）、B 列: 値。
   * 根拠: master-sheet-schema.md § 4
   */
  export function getSettings(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet
  ): Settings {
    const settingsSheetName = "設定";
    const sheet = ss.getSheetByName(settingsSheetName);
    if (!sheet) {
      throw new Error(`設定シート "${settingsSheetName}" が見つかりません`);
    }

    const all = getAllRows(sheet);
    const map: { [key: string]: string } = {};
    for (let i = 0; i < all.length; i++) {
      const row = all[i];
      const key = String(row[0] ?? "").trim();
      const value = String(row[1] ?? "").trim();
      if (key) {
        map[key] = value;
      }
    }

    // 必須キーの存在確認（警告ログ）
    const requiredKeys: Array<keyof Settings> = [
      "Phase1テンプレID_土地売買契約書",
      "Phase1出力先フォルダID",
      "物件シート名",
      "案件一覧シート名",
    ];
    for (const key of requiredKeys) {
      if (!map[key]) {
        Logger_.warn(
          `getSettings: 設定シートに "${String(key)}" が存在しないか空です`
        );
      }
    }

    return {
      出力先フォルダID: map["出力先フォルダID"] ?? "",
      テンプレートシート名: map["テンプレートシート名"] ?? "見積書",
      案件一覧シート名: map["案件一覧シート名"] ?? "案件一覧",
      物件シート名: map["物件シート名"] ?? "物件",
      Phase1テンプレID_土地売買契約書:
        map["Phase1テンプレID_土地売買契約書"] ?? "",
      Phase1出力先フォルダID: map["Phase1出力先フォルダID"] ?? "",
      ...map,
    } as Settings;
  }

  // ----------------------------------------------------------
  // Phase 1 固有: 案件一覧シート
  // 根拠: master-sheet-schema.md § 2「Phase 1 段階」
  // ----------------------------------------------------------

  /**
   * 案件一覧シートから全案件行を返す。
   * 根拠: master-sheet-schema.md § 2「案件一覧シート Phase 1 段階」
   */
  export function getAllCaseRows(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    sheetName: string
  ): CaseRow[] {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`案件一覧シート "${sheetName}" が見つかりません`);
    }
    return getDataRows(sheet) as unknown as CaseRow[];
  }

  /**
   * 案件 ID を指定して案件一覧シートから 1 行取得する。
   * 見つからない場合は null を返す。
   * 根拠: master-sheet-schema.md § 2「A列: 案件ID」
   */
  export function getCaseRowById(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    sheetName: string,
    caseId: string
  ): CaseRow | null {
    const rows = getAllCaseRows(ss, sheetName);
    const found = rows.find((row) => String(row.案件ID).trim() === caseId.trim());
    return found ?? null;
  }

  /**
   * 現在アクティブなセルが含まれる行の案件データを返す。
   * アクティブセルが 2 行目以降のデータ行にない場合は null を返す。
   *
   * 根拠: specification.md § 3「Phase 1 詳細」—「案件一覧シートからアクティブ行を選び」
   * 実装方針: GAS 標準 API の getActiveRange() で現在行を特定する。
   */
  export function getActiveCaseRow(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    sheetName: string
  ): CaseRow | null {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`案件一覧シート "${sheetName}" が見つかりません`);
    }

    const activeRange = ss.getActiveRange();
    if (!activeRange) {
      Logger_.warn("getActiveCaseRow: アクティブなセルがありません");
      return null;
    }

    // アクティブセルが対象シートにあるか確認
    const activeSheet = ss.getActiveSheet();
    if (activeSheet.getName() !== sheetName) {
      Logger_.warn(
        `getActiveCaseRow: アクティブシート "${activeSheet.getName()}" は案件一覧シート "${sheetName}" ではありません`
      );
      return null;
    }

    const activeRow = activeRange.getRow();
    // 1 行目はヘッダー行なのでデータは 2 行目以降 (master-sheet-schema.md § 2)
    if (activeRow < 2) {
      Logger_.warn(
        `getActiveCaseRow: アクティブ行 ${activeRow} はヘッダー行です。データ行（2行目以降）を選択してください`
      );
      return null;
    }

    const all = getAllRows(sheet);
    if (all.length < activeRow) {
      return null;
    }
    const headers = all[0] as string[];
    const row = all[activeRow - 1]; // getRow() は 1 始まり
    if (!row) return null;

    const record: SheetRow = {};
    headers.forEach((h, i) => {
      record[h] = row[i] as string | number | boolean | Date;
    });
    return record as unknown as CaseRow;
  }

  // ----------------------------------------------------------
  // Phase 1 固有: 物件シート
  // 根拠: master-sheet-schema.md § 3「物件シート」
  // ----------------------------------------------------------

  /**
   * 物件シートから指定案件 ID に紐づく物件行を返す。
   * 1 案件 = 複数行。物件No 順でソートして返す。
   *
   * 根拠: master-sheet-schema.md § 3
   * 「案件 ID で紐づく繰返し項目。1 案件 = 複数行」
   * 「A列: 案件ID (案件マスタの案件ID と結合)」
   */
  export function getPropertyRowsByCaseId(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    sheetName: string,
    caseId: string
  ): PropertyRow[] {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`物件シート "${sheetName}" が見つかりません`);
    }

    const rows = getDataRows(sheet) as unknown as PropertyRow[];
    const filtered = rows.filter(
      (row) => String(row.案件ID).trim() === caseId.trim()
    );

    // 物件No 順でソート (master-sheet-schema.md § 3「B列: 物件No 案件内の連番」)
    filtered.sort((a, b) => Number(a.物件No) - Number(b.物件No));

    return filtered;
  }
}
