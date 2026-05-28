// ============================================================
// partnerMasterService.ts — 取引先マスタシート読み込みサービス
// Phase 2: 伐採業者・買主などの法人情報を ID 参照で引く
//
// 仕様書根拠:
//   - docs/master-sheet-schema.md § 9「取引先マスタシート」
//     列構成: A=取引先ID / B=区分 / C=会社名 / D=代表者名 / E=住所 /
//             F=連絡先 / G=登録番号 / H=銀行名 / I=支店名 / J=口座種別 /
//             K=口座番号 / L=口座名義 / M=口座名義カナ / N=備考
//   - docs/specification.md § 8「マスタに必須値が無い → スキップ + 警告」
// ============================================================

namespace PartnerMasterService {
  // ----------------------------------------------------------
  // パブリック API
  // ----------------------------------------------------------

  /**
   * 取引先マスタシートから全行を読み込む。
   * 根拠: master-sheet-schema.md § 9
   */
  export function getAllRows(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    sheetName: string
  ): PartnerRow[] {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`取引先マスタシート "${sheetName}" が見つかりません`);
    }
    const raw = SheetService.getDataRows(sheet);
    return raw.map((row) => normalizeRow_(row));
  }

  /**
   * 取引先 ID で 1 件取得する。
   * 空 ID（A 系統で買主＝リフォレ固定など）は null を返す（警告ログなし）。
   *
   * @param ss
   * @param sheetName
   * @param partnerId  取引先 ID。空文字なら null
   */
  export function getById(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    sheetName: string,
    partnerId: string
  ): PartnerRow | null {
    const trimmed = String(partnerId ?? "").trim();
    if (!trimmed) return null;
    const rows = getAllRows(ss, sheetName);
    const found = rows.find(
      (row) => String(row.取引先ID ?? "").trim() === trimmed
    );
    if (!found) {
      Logger_.warn(
        `[PartnerMasterService] 取引先ID "${trimmed}" が取引先マスタに存在しません`
      );
      return null;
    }
    return found;
  }

  // ----------------------------------------------------------
  // プライベートヘルパー
  // ----------------------------------------------------------

  function normalizeRow_(raw: SheetRow): PartnerRow {
    return {
      取引先ID: String(raw["取引先ID"] ?? "").trim(),
      区分: String(raw["区分"] ?? "").trim(),
      会社名: String(raw["会社名"] ?? "").trim(),
      代表者名: String(raw["代表者名"] ?? "").trim(),
      住所: String(raw["住所"] ?? "").trim(),
      連絡先: String(raw["連絡先"] ?? "").trim(),
      登録番号: String(raw["登録番号"] ?? "").trim(),
      銀行名: String(raw["銀行名"] ?? "").trim(),
      支店名: String(raw["支店名"] ?? "").trim(),
      口座種別: String(raw["口座種別"] ?? "").trim(),
      口座番号: String(raw["口座番号"] ?? "").trim(),
      口座名義: String(raw["口座名義"] ?? "").trim(),
      口座名義カナ: String(raw["口座名義カナ"] ?? "").trim(),
      備考: String(raw["備考"] ?? "").trim(),
    };
  }
}
