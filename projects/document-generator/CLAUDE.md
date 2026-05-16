# CLAUDE.md — document-generator 固有ルール

GAS 共通ルールはリポジトリルートの [`CLAUDE.md`](../../CLAUDE.md)、
クライアント全体の背景は [`docs/client-overview.md`](../../docs/client-overview.md) を参照してください。
このファイルには **document-generator 固有** の注意点のみを記載します。

## プロジェクト概要

スプレッドシートに入力された案件情報を Google Docs テンプレートに差し込み、
PDF として指定 Drive フォルダに出力する書類生成システム。

- GAS の種別: **Sheets コンテナバインド型**（メニュー → モーダルダイアログ）
- テンプレートは **Google Docs に統一**（既存 Word はインポートして Docs 化）
- 書類は約 15 種類、1 案件で同時に最大 6 件程度出力

## このプロジェクトで特に重要なこと

### 1. ドキュメントを必ず先に確認

実装に取りかかる前に、必ず以下を読む:

- [`docs/specification.md`](./docs/specification.md) — 全体仕様
- [`docs/placeholder-rules.md`](./docs/placeholder-rules.md) — プレースホルダ規約（差し込みの記法）
- [`docs/master-sheet-schema.md`](./docs/master-sheet-schema.md) — マスタシートの列構成
- [`docs/documents/`](./docs/documents/) — 書類ごとの仕様

書類ごとの差し込みルールや出力条件はそれぞれの `docs/documents/<書類名>.md` にあるため、
**書類に関連する変更は必ずその書類の仕様書を併せて読む**。

### 2. テンプレートを直接編集しない

Google Docs のテンプレート本体は事務担当が運用するため、Claude が勝手に編集しない。
プレースホルダ規約を変更する場合は、テンプレ側の修正を伴うかを事前にユーザーに確認する。

### 3. 段階的に進める（Phase 設計）

- Phase 1: 単純差し込みの 1 書類で MVP
- Phase 2: 複数書類対応・選択 UI
- Phase 3: 条件分岐・繰返し対応
- Phase 4: テンプレ整合性チェック等の補助機能

Phase をまたぐ実装を一度にやらない。各 Phase の完了時に仕様書を更新する。

## 使用予定 OAuth スコープ（暫定）

| スコープ | 用途 |
|---|---|
| `spreadsheets` | マスタシートの読み取り |
| `drive` | テンプレ複製・PDF 化・指定フォルダへの保存 |
| `documents` | Google Docs のプレースホルダ置換 |
| `script.container.ui` | メニュー・ダイアログ表示 |

実装段階で正式に確定させ、`appsscript.json` と仕様書に反映する。
