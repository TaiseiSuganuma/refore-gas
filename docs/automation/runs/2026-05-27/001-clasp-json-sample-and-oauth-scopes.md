# clasp-json-sample-and-oauth-scopes

## 種別
A（インフラ・設定系）

## プロジェクト
document-generator

## 仕様書根拠
- `docs/specification.md` § 7「使用 OAuth スコープ（暫定）」:
  Phase 1 で必要なスコープとして `spreadsheets`、`drive`、`documents`、`script.container.ui` が明記されている
- `docs/schedule.md` § document-generator Phase 1 Claude 実装タスク:
  「`.clasp.json.sample` の作成、`appsscript.json` のスコープ設定」が最初の実装タスクとして明示

## 実施内容
1. `.clasp.json.sample` を作成（registry-ocr と同じフォーマット: `{"scriptId":"<YOUR_SCRIPT_ID>","rootDir":"./src"}`）
   - ルート `.gitignore` で `.clasp.json` が除外済みのため、sample ファイルは追跡対象になる
2. `src/appsscript.json` の `oauthScopes` に `documents` と `script.container.ui` を追加
   - 既存スコープ（`spreadsheets`、`drive`、`script.external_request`）は変更しない
   - `documents`: Google Docs テンプレの操作に必要（Phase 1 コアスコープ）
   - `script.container.ui`: メニュー・ダイアログ表示に必要（Phase 1 コアスコープ）
3. `npm install` を実行（TypeScript の `tsc` バイナリが壊れていたため再インストール）
   - 直接パス `/node_modules/typescript/bin/tsc` で型チェック通過を確認

## 検証
- npm run typecheck: `/node_modules/typescript/bin/tsc --noEmit` で通過（exit 0）
  ※ `.bin/tsc` シンボリックリンクが壊れているため直接パスで実行

## ドキュメント更新
- 更新不要（`appsscript.json` の変更は仕様書 § 7 に既に記載済みのため `specification.md` の更新は不要）

## コミット
（コミット後に追記）

## Slack 通知
完了報告あり
