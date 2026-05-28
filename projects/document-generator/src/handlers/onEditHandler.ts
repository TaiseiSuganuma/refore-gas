// ============================================================
// onEditHandler.ts — 案件パターン編集時の書類列自動チェック投入
// Phase 2
//
// 仕様書根拠:
//   - docs/master-sheet-schema.md § 2「Phase 2 段階」「初期チェック投入ロジック」
//     「案件パターン列が編集されたら、対応する書類列を自動 ON」
//   - docs/master-sheet-schema.md § 7「案件パターン → 書類セット自動チェック表」
//   - docs/specification.md § 3「Phase 2 詳細」
//     「パターン選択時の onEdit で書類列の初期チェック自動投入」
//
// 動作:
//   - 案件一覧シートの「案件パターン」列が編集された行に対して
//   - 書類マスタの「対応パターン」と突合し、該当書類列を自動 TRUE にする
//   - 既に TRUE になっている列は維持（後ろから上書きしない）
//   - 既に FALSE で意図的に OFF にされた列は尊重しない簡易実装（Phase 2 MVP）
//     → ユーザー判断で上書き挙動を変更する場合は Phase 4 で検討
// ============================================================

namespace OnEditHandler {
  /**
   * onEdit トリガーから呼ばれるエントリーポイント。
   * イベント情報から案件パターン列の編集か判定し、該当する場合のみ処理する。
   *
   * @param e GAS の onEdit イベントオブジェクト
   */
  export function handleEdit(
    e: GoogleAppsScript.Events.SheetsOnEdit
  ): void {
    try {
      const range = e.range;
      if (!range) return;

      const sheet = range.getSheet();
      const ss = sheet.getParent();

      let settings: Settings;
      try {
        settings = SheetService.getSettings(ss);
      } catch (err) {
        // 設定シートが読めない環境では何もしない
        Logger_.warn(`[OnEditHandler] 設定シート読込失敗: ${err}`);
        return;
      }

      // 案件一覧シート以外は対象外
      const caseSheetName = settings.案件一覧シート名;
      if (sheet.getName() !== caseSheetName) return;

      // ヘッダー行は対象外
      const editedRow = range.getRow();
      if (editedRow < 2) return;

      // 編集セルが「案件パターン」列か判定
      const colMap = SheetService.getHeaderColumnMap(sheet);
      const patternCol = colMap["案件パターン"];
      if (!patternCol || range.getColumn() !== patternCol) return;

      const newPattern = String(e.value ?? range.getValue() ?? "").trim();
      if (!newPattern) return;

      Logger_.info(
        `[OnEditHandler] 案件パターン編集検知 行${editedRow} → "${newPattern}"`
      );

      // 書類マスタから対応書類を取得
      const documentMasterSheetName =
        settings["書類マスタシート名"] || "書類マスタ";
      let matchedDocs: DocumentMasterRow[];
      try {
        matchedDocs = DocumentMasterService.getMatchingDocuments(
          ss,
          documentMasterSheetName,
          newPattern
        );
      } catch (err) {
        Logger_.warn(`[OnEditHandler] 書類マスタ読込失敗: ${err}`);
        return;
      }

      if (matchedDocs.length === 0) {
        Logger_.info(
          `[OnEditHandler] パターン "${newPattern}" に該当する有効書類なし`
        );
        return;
      }

      // 該当する書類列を TRUE にする
      let updatedCount = 0;
      for (const doc of matchedDocs) {
        const colName = `書類_${doc.書類名}`;
        const docCol = colMap[colName];
        if (!docCol) {
          Logger_.warn(
            `[OnEditHandler] 案件一覧に列 "${colName}" が見つかりません (書類ID: ${doc.書類ID})`
          );
          continue;
        }
        sheet.getRange(editedRow, docCol).setValue(true);
        updatedCount++;
      }

      Logger_.info(
        `[OnEditHandler] 行${editedRow} のパターン "${newPattern}" に対応する ${updatedCount} 書類を自動 ON`
      );
    } catch (err) {
      Logger_.error(`[OnEditHandler] エラー: ${err}`);
    }
  }
}
