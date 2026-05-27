# types-contract-context

## 種別
B（GAS コード実装）

## プロジェクト
document-generator

## 仕様書根拠
- `docs/master-sheet-schema.md` § 2「Phase 1 段階（案件一覧シート A〜X 列）」
- `docs/master-sheet-schema.md` § 3「新しい列構成（物件シート A〜K 列）」
- `docs/master-sheet-schema.md` § 4「設定シート」
- `docs/placeholder-rules.md` § 1「値差し込み（Phase 1 で実装）」
- `docs/documents/purchase_contract_land_placeholders.md`「プレースホルダ一覧（サマリー）21 個」
- `docs/specification.md` § 4.1「入力仕様」, § 8「エラーハンドリング方針」

## 実施内容
1. 既存の `WebAppRequest`, `WebAppResponse`, `SheetRow` 型は互換を保ちつつ維持
2. `CaseRow` 型: 案件一覧シート（A〜X 列）の全カラムを型付け
3. `PropertyRow` 型: 物件シート（A〜K 列）の全カラムを型付け
4. `SettingsRow` 型: 設定シートの1行分（項目/値/説明）を型付け
5. `Settings` 型: 設定シートをキー値マップとして読み込んだ後の型（Phase 1 追加項目含む）
6. `LandPurchaseContractContext` 型: 土地売買契約書の 21 個プレースホルダに対応する型（値はフォーマット済み文字列）
7. `PlaceholderContext` 型: Phase 2 以降の汎用プレースホルダ対応用インデックス型
8. `DocumentGenerationResult` 型: 書類生成の成功/失敗・PDF URL を含む結果型

## 検証
- npm run typecheck: ✅ 通過（tsc.js 直接実行、エラー出力なし）

## ドキュメント更新
- `docs/automation/runs/2026-05-27/002-types-contract-context.md`（本ファイル）を新規作成
- `docs/schedule.md`: `src/types/index.ts` タスクを `[x]` に更新
- `docs/automation/state.md`: `completed` に追記、`today_commits` インクリメント

## コミット
- （次のステップでコミット）

## Slack 通知
完了報告を送信
