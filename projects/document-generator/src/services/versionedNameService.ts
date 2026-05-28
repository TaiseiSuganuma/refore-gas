// ============================================================
// versionedNameService.ts — PDF 同名衝突時の バージョン suffix 付与
// Phase 2: 再出力時にファイル名を上書きせず _v2, _v3 ... を付与する
//
// 仕様書根拠:
//   - docs/specification.md § 4.2「出力（PDF）」
//     「再出力時は `_v2`, `_v3` ... を付与」
//   - docs/specification.md § 8「既存 PDF と同名 → `_v2`, `_v3` ... と suffix（上書きしない）」
//   - docs/master-sheet-schema.md § 4 設定シート「バージョン区切り文字」(_v)
// ============================================================

namespace VersionedNameService {
  // ----------------------------------------------------------
  // 定数
  // ----------------------------------------------------------

  /** バージョン suffix のデフォルト区切り文字 */
  const DEFAULT_VERSION_SEPARATOR = "_v";

  // ----------------------------------------------------------
  // パブリック API
  // ----------------------------------------------------------

  /**
   * 指定フォルダ内で同名 PDF が存在しない一意なファイル名を返す。
   * 既存 → `_v2`, `_v3` ... を付与する。
   *
   * 根拠: specification.md § 4.2 / § 8 / master-sheet-schema.md § 4 「バージョン区切り文字」
   *
   * @param folder         配置先フォルダ
   * @param baseName       拡張子付きの希望ファイル名（例: "EST-001_土地売買契約書_20260528.pdf"）
   * @param separator      バージョン区切り文字（デフォルト "_v"）
   * @returns 衝突しないファイル名
   */
  export function buildUniqueFileName(
    folder: GoogleAppsScript.Drive.Folder,
    baseName: string,
    separator: string = DEFAULT_VERSION_SEPARATOR
  ): string {
    if (!fileExists_(folder, baseName)) {
      return baseName;
    }

    const { stem, ext } = splitExtension_(baseName);
    // _v2 から開始（_v1 は付けない運用）
    for (let v = 2; v <= 100; v++) {
      const candidate = `${stem}${separator}${v}${ext}`;
      if (!fileExists_(folder, candidate)) {
        return candidate;
      }
    }
    // 万一 100 回試して全部衝突した場合はタイムスタンプ
    const ts = Utilities.formatDate(
      new Date(),
      "Asia/Tokyo",
      "HHmmss"
    );
    return `${stem}${separator}${ts}${ext}`;
  }

  // ----------------------------------------------------------
  // プライベートヘルパー
  // ----------------------------------------------------------

  function fileExists_(
    folder: GoogleAppsScript.Drive.Folder,
    name: string
  ): boolean {
    const it = folder.getFilesByName(name);
    return it.hasNext();
  }

  function splitExtension_(name: string): { stem: string; ext: string } {
    const dot = name.lastIndexOf(".");
    if (dot <= 0) return { stem: name, ext: "" };
    return { stem: name.slice(0, dot), ext: name.slice(dot) };
  }
}
