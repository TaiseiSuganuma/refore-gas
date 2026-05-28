// ============================================================
// projectFolderService.ts — 案件フォルダ自動作成サービス
// Phase 2: 案件ごとに「案件/YYYY/MM/<案件ID>_<地域>_<相手方名>/」フォルダを自動作成
//
// 仕様書根拠:
//   - docs/specification.md § 1「North Star」
//     「案件/YYYY/MM/<案件ID>_<地域>_<相手方名>/ で物理的に月別に区切る」
//   - docs/specification.md § 4.2「出力（PDF）」
//     保存先: Phase 2 以降は `案件/YYYY/MM/<案件ID>_<地域>_<相手方名>/` に自動配置
//   - docs/specification.md § 8「フォルダ作成失敗 → 該当案件のみスキップ + ログに警告」
//
// 命名規則:
//   - 親フォルダ: 設定シート「共通PDF出力先親フォルダID」
//   - その下に「YYYY」/「MM」/「<案件ID>_<地域>_<相手方名>」を作成
//   - 相手方名: A 系統 = 売主氏名、B 系統 = 買主氏名（または取引先マスタの会社名）
// ============================================================

namespace ProjectFolderService {
  // ----------------------------------------------------------
  // パブリック API
  // ----------------------------------------------------------

  /**
   * 案件フォルダを取得（無ければ作成）し、その Folder を返す。
   *
   * フォルダ構造: <親フォルダ>/YYYY/MM/<案件ID>_<地域>_<相手方名>/
   *
   * 根拠: specification.md § 1「North Star」のディレクトリ構造
   *
   * @param parentFolderId 共通PDF出力先親フォルダ ID
   * @param caseRow        案件行（契約日・地域・売主氏名・買主氏名等を含む）
   * @returns 案件フォルダの Folder
   */
  export function getOrCreateProjectFolder(
    parentFolderId: string,
    caseRow: CaseRow
  ): GoogleAppsScript.Drive.Folder {
    if (!parentFolderId) {
      throw new Error(
        "ProjectFolderService: 親フォルダID（共通PDF出力先親フォルダID）が空です"
      );
    }

    const parent = DriveApp.getFolderById(parentFolderId);

    // 契約日から YYYY / MM を決定
    // 契約日が未設定の場合は当日日付で代替
    const baseDate = parseDateOrToday_(caseRow.契約日);
    const yyyy = String(baseDate.getFullYear());
    const mm = String(baseDate.getMonth() + 1).padStart(2, "0");

    // YYYY フォルダ
    const yearFolder = getOrCreateChildFolder_(parent, yyyy);
    // MM フォルダ
    const monthFolder = getOrCreateChildFolder_(yearFolder, mm);

    // <案件ID>_<地域>_<相手方名> フォルダ
    const projectFolderName = buildProjectFolderName_(caseRow);
    const projectFolder = getOrCreateChildFolder_(monthFolder, projectFolderName);

    return projectFolder;
  }

  /**
   * 案件フォルダのフォルダ名を組み立てる。
   * 形式: `<案件ID>_<地域>_<相手方名>`
   * 各値が空の場合はその区切りも省略する（例: 地域が空 → `EST-..._佐藤てるお`）。
   *
   * 相手方名:
   *   - A 系統（案件パターンが "A" で始まる）: 売主氏名
   *   - B 系統（案件パターンが "B" で始まる）: 買主氏名
   *   - パターン不明: 売主氏名を優先、なければ買主氏名
   *
   * 根拠: specification.md § 1「相手方名はパターン依存」
   */
  export function buildProjectFolderName_(caseRow: CaseRow): string {
    const caseId = String(caseRow.案件ID ?? "").trim();
    const region = String((caseRow as unknown as SheetRow)["地域"] ?? "").trim();
    const pattern = String(
      (caseRow as unknown as SheetRow)["案件パターン"] ?? ""
    ).trim();
    const sellerName = String(
      (caseRow as unknown as SheetRow)["売主氏名"] ?? caseRow.宛名 ?? ""
    ).trim();
    const buyerName = String(
      (caseRow as unknown as SheetRow)["買主氏名"] ?? ""
    ).trim();

    let counterpartyName: string;
    if (pattern.startsWith("A")) {
      counterpartyName = sellerName;
    } else if (pattern.startsWith("B")) {
      counterpartyName = buyerName || sellerName;
    } else {
      counterpartyName = sellerName || buyerName;
    }

    const parts = [caseId, region, counterpartyName].filter((s) => s.length > 0);
    return parts.join("_");
  }

  // ----------------------------------------------------------
  // プライベートヘルパー
  // ----------------------------------------------------------

  /**
   * 親フォルダ直下の子フォルダを取得（無ければ作成）する。
   * 同名フォルダが複数存在する場合は最初の 1 件を返す。
   */
  function getOrCreateChildFolder_(
    parent: GoogleAppsScript.Drive.Folder,
    name: string
  ): GoogleAppsScript.Drive.Folder {
    const it = parent.getFoldersByName(name);
    if (it.hasNext()) {
      return it.next();
    }
    return parent.createFolder(name);
  }

  /**
   * 日付らしき値を Date に変換する。失敗時は今日の日付を返す。
   */
  function parseDateOrToday_(value: Date | string | undefined): Date {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const d = new Date(value.trim());
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }
}
