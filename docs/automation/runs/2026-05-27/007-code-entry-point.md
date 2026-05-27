# code-entry-point

## 種別
B（GAS コード実装）

## プロジェクト
document-generator

## 仕様書根拠
docs/specification.md § 3「Phase 1 詳細」手順 4
> 「メニュー「書類出力」→「土地売買契約書」項目で実行」

docs/specification.md § 11「関連ファイル一覧」
> 「src/Code.ts: GAS グローバル関数（onOpen, generateLandPurchaseContract, generateBatchDocuments 等）」

## 実施内容
1. `src/Code.ts` の `onOpen()` を「書類出力」メニュー + 「土地売買契約書」アイテムに変更
2. グローバル関数 `generateLandPurchaseContract()` を追加し、`DocumentHandler.generateLandPurchaseContract()` に委譲
3. 仕様書根拠コメントを追記
4. `npm run typecheck`（node 直接実行）で型エラーなしを確認

## 検証
- npm run typecheck: 通過（出力なし）
  ※ `.bin/tsc` の symlink 壊れのため `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` で代替実行

## ドキュメント更新
- `docs/schedule.md`: `src/Code.ts: onOpen メニュー、generateLandPurchaseContract エントリ` を `[x]` に更新

## コミット
- （コミット後に記録）

## Slack 通知
完了報告を送信
