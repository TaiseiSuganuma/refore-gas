# document-handler

## 種別
B（GAS コード実装）

## プロジェクト
document-generator

## 仕様書根拠
- docs/specification.md § 3「Phase 1 詳細」— アクティブ行取得 → 物件行取得 → プレースホルダ置換 → PDF 保存のフロー
- docs/specification.md § 8「エラーハンドリング方針」— 必須値なし時のスキップ・警告ログ・一時 Docs の finally 削除
- docs/specification.md § 11「関連ファイル一覧」— documentHandler.ts: 単発書類生成オーケストレーション（Phase 1）

## 実施内容
1. `src/handlers/documentHandler.ts` を新規作成
2. `DocumentHandler` namespace を定義
3. `generateLandPurchaseContract()` を実装:
   - `SheetService.getSettings()` で設定取得（テンプレID・出力フォルダID・シート名を確認）
   - `SheetService.getActiveCaseRow()` でアクティブ行の案件データを取得
   - `SheetService.getPropertyRowsByCaseId()` で物件データを取得（0件は警告ログで継続）
   - `PlaceholderService.buildLandPurchaseContractContext()` でコンテキスト生成
   - `TemplateService.generatePdfFromTemplate()` で PDF 生成・保存
   - 成功時: UI アラートで案件ID・PDF URL を通知
   - 各ステップでエラーをキャッチし、UI アラートで通知して DocumentGenerationResult を返す

## 検証
- npm run typecheck（node 直接呼び出し）: ✅ エラーなし（出力なし = 正常）
- `.bin/tsc` スタブのパス解決が壊れているため `node modules/typescript/lib/tsc.js` を直接呼び出して確認

## ドキュメント更新
- `docs/automation/runs/2026-05-27/006-document-handler.md`（本ファイル）を作成
- `docs/schedule.md`の `documentHandler.ts` タスクを `[x]` に更新

## コミット
- （コミット後に記入）

## Slack 通知
完了報告を送信
