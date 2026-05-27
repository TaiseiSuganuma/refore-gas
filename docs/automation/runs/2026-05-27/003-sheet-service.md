# sheet-service

## 種別
B（GAS コード実装）

## プロジェクト
document-generator

## 仕様書根拠
- `docs/master-sheet-schema.md § 2`「案件一覧シート Phase 1 段階」— 列構成・必須列・アクティブ行の取得方法
- `docs/master-sheet-schema.md § 3`「物件シート」— 案件IDで紐づく繰返し項目、物件No順ソート
- `docs/master-sheet-schema.md § 4`「設定シート」— A列:項目、B列:値のキー値マップ構造
- `docs/specification.md § 4.1`「入力仕様: アクティブ行 1 件」— Phase 1 で getActiveCaseRow が必要

## 実施内容
1. 既存スケルトン（`getOrCreateSheet` / `getAllRows` / `getDataRows` / `appendRows`）に Phase 1 固有の実装を追加
2. `getSettings()` — 設定シートをキー値マップとして読み込み、必須キーの欠損警告付きで `Settings` を返す
3. `getAllCaseRows()` — 案件一覧シート全行を `CaseRow[]` で返す
4. `getCaseRowById()` — 案件IDで 1 行検索
5. `getActiveCaseRow()` — `SpreadsheetApp.getActiveRange()` でアクティブ行を特定し `CaseRow` を返す
6. `getPropertyRowsByCaseId()` — 物件シートから案件IDで絞り込み、物件No順にソートして返す
7. TypeScript 5.9 の厳格な型チェックに対応: `SheetRow[] → CaseRow[]` 等を `as unknown as` で変換
8. `npm run typecheck` が通ることを確認（node 経由で `_tsc.js` を直接実行）

## 検証
- npm run typecheck: 通過（tsc --noEmit エラーなし）
  - ※ TypeScript 5.9.3 では `node_modules/.bin/tsc` の参照先が `../lib/tsc.js` → 実体は `_tsc.js` に変わっており、直接 node で実行することで確認

## ドキュメント更新
- `docs/automation/runs/2026-05-27/003-sheet-service.md`（本ファイル）
- `docs/schedule.md`（`sheetService.ts` のチェックボックスを `[x]` に更新）
- `docs/automation/state.md`（`completed` に追記）

## コミット
- （コミット後に記入）

## Slack 通知
完了報告を投稿
