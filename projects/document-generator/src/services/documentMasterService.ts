// ============================================================
// documentMasterService.ts — 書類マスタシート読み込みサービス
// Phase 2: バッチ書類生成
//
// 仕様書根拠:
//   - docs/master-sheet-schema.md § 5「書類マスタシート」
//     列構成: A=書類名 / B=宛先/対象者 / C=出力条件 / D=原本 /
//             E=テンプレート / F=テンプレートURL / G=備考 /
//             H=書類ID / I=対応パターン / J=ファイル名テンプレ / K=有効
//   - docs/master-sheet-schema.md § 7「案件パターン → 書類セット自動チェック表」
//     対応パターンはカンマ区切り（例: "A③" or "A②,A③,B²"）
//   - docs/specification.md § 8「マスタに必須値が無い → 該当案件のみスキップ + ログに警告」
// ============================================================

namespace DocumentMasterService {
  // ----------------------------------------------------------
  // パブリック API
  // ----------------------------------------------------------

  /**
   * 書類マスタシートから全行を読み込む。
   * ヘッダー行を除いた DocumentMasterRow[] を返す。
   *
   * 根拠: master-sheet-schema.md § 5「書類マスタシート」
   */
  export function getAllRows(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    sheetName: string
  ): DocumentMasterRow[] {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`書類マスタシート "${sheetName}" が見つかりません`);
    }

    const raw = SheetService.getDataRows(sheet);
    return raw.map((row) => normalizeRow_(row));
  }

  /**
   * 書類 ID で書類マスタ行を 1 件取得する。
   * 見つからない / 「有効」が false の場合は null を返す。
   *
   * 根拠: master-sheet-schema.md § 5「書類ID は内部識別子、案件一覧の書類列と対応」
   */
  export function getEnabledRowById(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    sheetName: string,
    documentId: string
  ): DocumentMasterRow | null {
    const rows = getAllRows(ss, sheetName);
    const found = rows.find(
      (row) => String(row.書類ID ?? "").trim() === documentId.trim()
    );
    if (!found) {
      Logger_.warn(
        `[DocumentMasterService] 書類ID "${documentId}" が書類マスタに存在しません`
      );
      return null;
    }
    if (!found.有効) {
      Logger_.info(
        `[DocumentMasterService] 書類ID "${documentId}" は「有効」=FALSE のためスキップ`
      );
      return null;
    }
    return found;
  }

  /**
   * 書類名で書類マスタ行を 1 件取得する（案件一覧の書類列名から逆引きするため）。
   * 案件一覧の列名は `書類_<書類名>` 形式（例: 書類_土地売買契約書）。
   * suffix の `<書類名>` が書類マスタの A 列「書類名」と一致する。
   *
   * 根拠: master-sheet-schema.md § 5「A列『書類名』は案件一覧の書類列名の suffix と一致」
   */
  export function findByName(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    sheetName: string,
    documentName: string
  ): DocumentMasterRow | null {
    const rows = getAllRows(ss, sheetName);
    const found = rows.find(
      (row) => String(row.書類名 ?? "").trim() === documentName.trim()
    );
    return found ?? null;
  }

  /**
   * テンプレートURL から Docs / Sheets の fileId を抽出する。
   * URL 形式: `https://docs.google.com/document/d/<ID>/edit?...`
   *           `https://docs.google.com/spreadsheets/d/<ID>/edit?...`
   *
   * @param url テンプレートURL
   * @returns fileId、抽出失敗時は空文字
   */
  export function extractFileIdFromUrl(url: string): string {
    if (!url) return "";
    const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    return m ? m[1] : "";
  }

  /**
   * 案件パターン（A①〜B②）に該当する有効な書類リストを返す。
   * 根拠: master-sheet-schema.md § 7「案件パターン → 書類セット自動チェック表」
   *       対応パターン列はカンマ区切り（例: "A③" or "A②,A³,B²"）
   *
   * @param ss          スプレッドシート
   * @param sheetName   書類マスタシート名
   * @param pattern     案件パターン（例: "A③"）
   * @returns 対応する書類マスタ行（有効=true のみ）
   */
  export function getMatchingDocuments(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    sheetName: string,
    pattern: string
  ): DocumentMasterRow[] {
    const trimmedPattern = pattern.trim();
    if (!trimmedPattern) return [];
    const rows = getAllRows(ss, sheetName);
    return rows.filter((row) => {
      if (!row.有効) return false;
      const patterns = String(row.対応パターン ?? "")
        .split(/[,、]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      return patterns.includes(trimmedPattern);
    });
  }

  // ----------------------------------------------------------
  // プライベートヘルパー
  // ----------------------------------------------------------

  /**
   * SheetRow（汎用ヘッダーキー辞書）を DocumentMasterRow 型に正規化する。
   * 「有効」列は TRUE/FALSE 文字列 / boolean / チェックボックス値のいずれもありうるため正規化する。
   */
  function normalizeRow_(raw: SheetRow): DocumentMasterRow {
    const 有効Raw = raw["有効"];
    const 有効: boolean =
      typeof 有効Raw === "boolean"
        ? 有効Raw
        : String(有効Raw ?? "").trim().toUpperCase() === "TRUE";

    return {
      書類名: String(raw["書類名"] ?? "").trim(),
      "宛先/対象者": String(raw["宛先/対象者"] ?? "").trim(),
      "出力条件/利用シーン": String(raw["出力条件/利用シーン"] ?? "").trim(),
      原本: String(raw["原本"] ?? "").trim(),
      テンプレート: String(raw["テンプレート"] ?? "").trim(),
      テンプレートURL: String(raw["テンプレートURL"] ?? "").trim(),
      備考: String(raw["備考"] ?? "").trim(),
      書類ID: String(raw["書類ID"] ?? "").trim(),
      対応パターン: String(raw["対応パターン"] ?? "").trim(),
      ファイル名テンプレ: String(raw["ファイル名テンプレ"] ?? "").trim(),
      有効,
    };
  }
}
