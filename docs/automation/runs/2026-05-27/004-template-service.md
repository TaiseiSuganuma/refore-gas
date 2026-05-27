# template-service

## 種別
B（GAS コード実装）

## プロジェクト
document-generator

## 仕様書根拠
- `docs/specification.md § 3「Phase 1 詳細」`:
  「テンプレ複製 → プレースホルダ置換 → 指定フォルダに PDF 保存」
- `docs/specification.md § 4.2「出力（PDF）」`:
  ファイル名: `{案件ID}_{書類名}_{YYYYMMDD}.pdf`
  保存先: 設定シートで指定したフォルダ（Phase 1）
- `docs/specification.md § 8「エラーハンドリング方針」`:
  「一時 Docs はエラー時も finally で削除」

## 実施内容
1. `src/services/templateService.ts` を新規作成
2. `TemplateService` 名前空間に以下を実装:
   - `generatePdfFromTemplate()`: メインの公開関数
     - テンプレ Docs を Drive 上でコピー（一時コピー）
     - 複製した Docs に `replaceAllPlaceholders_()` でプレースホルダ置換
     - `exportDocAsPdfBlob_()` で PDF Blob を取得
     - 出力フォルダに PDF ファイルを保存
     - finally ブロックで一時コピーを必ず削除
   - `replaceAllPlaceholders_()`: 本文・ヘッダー・フッターの `{{key}}` 置換
   - `exportDocAsPdfBlob_()`: UrlFetchApp + OAuth トークンで PDF エクスポート
   - `formatDateToYYYYMMDD_()`: ファイル名用の日付フォーマット

## 検証
- `node .../typescript/bin/tsc --noEmit -p tsconfig.json`: **型エラーなし**
  （`.bin/tsc` のシンボリックリンクが壊れているため直接実行）

## ドキュメント更新
- `docs/schedule.md`: `templateService.ts` タスクを `[x] 2026-05-27` に更新

## コミット
- （コミット後に記載）

## Slack 通知
完了報告予定
