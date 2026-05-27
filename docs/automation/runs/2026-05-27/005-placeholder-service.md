# placeholder-service

## 種別
B（GAS コード実装）

## プロジェクト
document-generator

## 仕様書根拠
- `docs/placeholder-rules.md § 1` — 値差し込み記法 `{{key}}` / フォーマット指定子 `date_jp` / `date` / `yen`
- `docs/documents/purchase_contract_land_placeholders.md`「プレースホルダ一覧（サマリー）」— 21 個のプレースホルダとデータ源の対応
- `docs/master-sheet-schema.md § 2 Phase 1 段階` — 案件一覧シート列構成 (A〜X)
- `docs/master-sheet-schema.md § 3` — 物件シートから地積・筆数集計
- `docs/specification.md § 8` — 「テンプレのプレースホルダがマスタに無い → 警告ログ + 処理継続」（未定義キーの扱いを決定）

## 実施内容
1. `src/services/placeholderService.ts` を新規作成
2. `PlaceholderService` namespace に以下を実装:
   - `buildLandPurchaseContractContext(caseRow, propertyRows)`: 21 個のプレースホルダを CaseRow / PropertyRow から組み立てる
   - `applyFormat_(rawValue, format)`: フォーマット指定子の適用（date_jp / date / yen）
   - `toJapaneseEra_(value)`: 和暦変換（令和 / 平成 / 昭和）
   - `toDateString_(value)`: 西暦「YYYY年M月D日」変換
   - `toDate_(value)`: Date / 文字列 / ISO 8601 を Date に変換
   - `formatNumberWithCommas_(value)`: カンマ整形（toLocaleString ja-JP 使用）
   - `parseNumber_(value)`: 文字列・通貨記号・全角数字のクリーニングして数値に変換
   - `warnEmptyValues_(context)`: 必須フィールドの空値警告ログ

3. 設計上のポイント:
   - 筆数 = 物件行数、地積 = 物件行の面積(㎡)の合計（Phase 1: 1物件想定、複数の場合は先頭行 + 警告）
   - 未定義キーの扱い: specification.md § 8 に従い「警告ログ + 処理継続（未差込のまま）」（案C相当）
   - `import` / `export` 構文を使わず namespace で実装（GAS 共通ルール準拠）
   - Node.js 専用ライブラリ不使用（toLocaleString は GAS V8 runtime で使用可能）

## 検証
- npm run typecheck: 通過（exit 0、エラーなし）
  ※ `.bin/tsc` の symlink が壊れていたため `node .../typescript/lib/tsc.js --noEmit` で直接実行して確認

## ドキュメント更新
- `docs/schedule.md`: `placeholderService.ts` タスクのチェックボックスを `[x]` に更新
- `docs/automation/state.md`: 完了タスク追加、today_commits インクリメント
- `docs/automation/runs/2026-05-27/005-placeholder-service.md`: このファイル（当日ログ）

## コミット
（コミット後に hash を追記）

## Slack 通知
完了報告を送信
