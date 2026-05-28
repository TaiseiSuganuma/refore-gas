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
      "共通PDF出力先親フォルダID",
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
      共通PDF出力先親フォルダID: map["共通PDF出力先親フォルダID"] ?? "",
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
    // 物件シートは旧「土地No」列名で運用されているため、両方を見る
    filtered.sort((a, b) => {
      const aNo = Number(a.物件No ?? (a as unknown as SheetRow)["土地No"]);
      const bNo = Number(b.物件No ?? (b as unknown as SheetRow)["土地No"]);
      return aNo - bNo;
    });

    return filtered;
  }

  // ----------------------------------------------------------
  // Phase 2: バッチ処理用 — 選択行抽出・ステータス更新
  // 根拠: master-sheet-schema.md § 2「Phase 2 段階」「行頭選択チェックボックス」
  //       specification.md § 3「Phase 2 詳細」「行頭チェック ON の案件を抽出」
  // ----------------------------------------------------------

  /**
   * 案件一覧シートのヘッダー → 列番号 (1-based) のマップを返す。
   * setValue() / updateStatus() で列番号を指定するために必要。
   */
  export function getHeaderColumnMap(
    sheet: GoogleAppsScript.Spreadsheet.Sheet
  ): { [header: string]: number } {
    const lastCol = sheet.getLastColumn();
    if (lastCol === 0) return {};
    const headers = sheet
      .getRange(1, 1, 1, lastCol)
      .getValues()[0] as string[];
    const map: { [header: string]: number } = {};
    headers.forEach((h, i) => {
      const trimmed = String(h ?? "").trim();
      if (trimmed) map[trimmed] = i + 1;
    });
    return map;
  }

  /**
   * 案件一覧シートから「選択」列が TRUE の行（CaseRow + 行番号）を返す。
   *
   * 根拠: master-sheet-schema.md § 2「A列: 選択（チェックボックス）」
   *       specification.md § 3「Phase 2 詳細」「行頭チェック ON の案件を抽出」
   *
   * @param ss          スプレッドシート
   * @param sheetName   案件一覧シート名
   * @param selectionColumnName  選択列名（設定シートから渡す、デフォルト "選択"）
   * @returns 選択された案件行と、その行番号（1-based、ヘッダー含む）
   */
  export function getSelectedCaseRows(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    sheetName: string,
    selectionColumnName: string = "選択"
  ): Array<{ row: CaseRow; rowNumber: number }> {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`案件一覧シート "${sheetName}" が見つかりません`);
    }

    const all = getAllRows(sheet);
    if (all.length < 2) return [];

    const headers = all[0] as string[];
    const selectionIdx = headers.findIndex(
      (h) => String(h ?? "").trim() === selectionColumnName
    );
    if (selectionIdx < 0) {
      Logger_.warn(
        `getSelectedCaseRows: 案件一覧シートに「${selectionColumnName}」列が見つかりません`
      );
      return [];
    }

    const results: Array<{ row: CaseRow; rowNumber: number }> = [];
    for (let i = 1; i < all.length; i++) {
      const row = all[i];
      const isSelected = row[selectionIdx] === true;
      if (!isSelected) continue;

      // 案件 ID が空の行はスキップ
      const caseIdIdx = headers.findIndex(
        (h) => String(h ?? "").trim() === "案件ID"
      );
      if (caseIdIdx < 0 || !String(row[caseIdIdx] ?? "").trim()) continue;

      const record: SheetRow = {};
      headers.forEach((h, idx) => {
        record[h] = row[idx] as string | number | boolean | Date;
      });
      results.push({
        row: record as unknown as CaseRow,
        rowNumber: i + 1, // 1-based、ヘッダー含む
      });
    }
    return results;
  }

  /**
   * 案件一覧シートの 1 行に対して、ステータス・フォルダURL・最終出力日時を更新する。
   *
   * 根拠: master-sheet-schema.md § 2 Phase 2 段階
   *       「ステータス」「フォルダURL」「最終出力日時」列
   *       specification.md § 4.3「ステータス遷移」(出力済みの自動セット)
   *
   * @param sheet        案件一覧シート
   * @param rowNumber    更新対象行番号 (1-based、ヘッダー含む)
   * @param status       ステータス値 (例: "出力済み")
   * @param folderUrl    フォルダURL (空文字なら更新しない)
   * @param updatedAt    最終出力日時 (Date)
   */
  export function updateCaseRowStatus(
    sheet: GoogleAppsScript.Spreadsheet.Sheet,
    rowNumber: number,
    status: string,
    folderUrl: string,
    updatedAt: Date
  ): void {
    const colMap = getHeaderColumnMap(sheet);

    const statusCol = colMap["ステータス"];
    const folderUrlCol = colMap["フォルダURL"];
    const updatedAtCol = colMap["最終出力日時"];

    if (statusCol) {
      sheet.getRange(rowNumber, statusCol).setValue(status);
    }
    if (folderUrlCol && folderUrl) {
      sheet.getRange(rowNumber, folderUrlCol).setValue(folderUrl);
    }
    if (updatedAtCol) {
      sheet.getRange(rowNumber, updatedAtCol).setValue(updatedAt);
    }
  }

  /**
   * CaseRow に対して書類列（「書類_<書類名>」形式）が ON の書類名一覧を抽出する。
   *
   * 根拠: master-sheet-schema.md § 2「Group 4: 書類選択チェックボックス（14 列）」
   *       案件一覧の AA〜AN 列が `書類_土地売買契約書` 〜 `書類_法務局_X5`
   *
   * @param caseRow CaseRow（SheetRow として読み込み済み）
   * @returns ON になっている書類列の suffix（書類マスタの「書類名」と一致）
   */
  export function getCheckedDocumentNames(caseRow: CaseRow): string[] {
    const record = caseRow as unknown as SheetRow;
    const result: string[] = [];
    for (const key of Object.keys(record)) {
      if (!key.startsWith("書類_")) continue;
      if (record[key] === true) {
        result.push(key.replace(/^書類_/, ""));
      }
    }
    return result;
  }
}
