// ============================================================
// agentMasterService.ts — 代理人マスタシート読み込みサービス
// Phase 2: 法務局申請書の代理人を ID 参照で引く
//
// 仕様書根拠:
//   - docs/master-sheet-schema.md § 10「代理人マスタシート」
//     列構成: A=代理人ID / B=氏名 / C=住所 / D=生年月日 /
//             E=連絡先 / F=関連取引先ID / G=備考
//   - docs/specification.md § 8「マスタに必須値が無い → スキップ + 警告」
//
// Phase 2 では存在のみ。実際にプレースホルダ展開で使うのは Phase 3 の法務局書類実装時。
// ============================================================

namespace AgentMasterService {
  // ----------------------------------------------------------
  // パブリック API
  // ----------------------------------------------------------

  /**
   * 代理人マスタシートから全行を読み込む。
   * データが 0 件でもエラーにせず空配列を返す（Phase 2 では空のことが多い）。
   *
   * 根拠: master-sheet-schema.md § 10
   */
  export function getAllRows(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    sheetName: string
  ): AgentRow[] {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error(`代理人マスタシート "${sheetName}" が見つかりません`);
    }
    const raw = SheetService.getDataRows(sheet);
    return raw.map((row) => normalizeRow_(row));
  }

  /**
   * 代理人 ID で 1 件取得する。
   * 空 ID は null を返す。
   */
  export function getById(
    ss: GoogleAppsScript.Spreadsheet.Spreadsheet,
    sheetName: string,
    agentId: string
  ): AgentRow | null {
    const trimmed = String(agentId ?? "").trim();
    if (!trimmed) return null;
    const rows = getAllRows(ss, sheetName);
    const found = rows.find(
      (row) => String(row.代理人ID ?? "").trim() === trimmed
    );
    if (!found) {
      Logger_.warn(
        `[AgentMasterService] 代理人ID "${trimmed}" が代理人マスタに存在しません`
      );
      return null;
    }
    return found;
  }

  // ----------------------------------------------------------
  // プライベートヘルパー
  // ----------------------------------------------------------

  function normalizeRow_(raw: SheetRow): AgentRow {
    return {
      代理人ID: String(raw["代理人ID"] ?? "").trim(),
      氏名: String(raw["氏名"] ?? "").trim(),
      住所: String(raw["住所"] ?? "").trim(),
      生年月日: (raw["生年月日"] as Date | string) ?? "",
      連絡先: String(raw["連絡先"] ?? "").trim(),
      関連取引先ID: String(raw["関連取引先ID"] ?? "").trim(),
      備考: String(raw["備考"] ?? "").trim(),
    };
  }
}
