# document-generator

スプレッドシートに入力された案件情報をもとに、Google Docs テンプレートへ差し込んで
PDF を指定 Drive フォルダに出力する GAS プロジェクトです。

> **仕様の詳細は [`docs/specification.md`](./docs/specification.md) を参照してください。**
> このファイルはセットアップ・運用手順を中心に記載しています。

## ステータス

🚧 **Phase 1（土地売買契約書 MVP）進行中** — 設計・準備は完了し、
ユーザーのシート編集作業（[`docs/phase1-user-tasks.md`](./docs/phase1-user-tasks.md)）の完了待ち。
進捗の詳細は [`docs/schedule.md`](../../docs/schedule.md) を参照。

## 機能概要（予定）

- スプレッドシートのカスタムメニュー「書類出力」から、出力したい書類を選択
- マスタシートの内容を Google Docs テンプレートのプレースホルダへ差し込み
- PDF を指定 Drive フォルダへ出力
- 約 15 種類の書類に対応、同時出力は最大 6 件程度

## ドキュメント

| ファイル | 内容 |
|---|---|
| [`docs/specification.md`](./docs/specification.md) | 全体仕様 |
| [`docs/master-sheet-schema.md`](./docs/master-sheet-schema.md) | マスタシートの列構成 |
| [`docs/placeholder-rules.md`](./docs/placeholder-rules.md) | プレースホルダ規約（差し込み記法） |
| [`docs/documents/`](./docs/documents/) | 書類ごとの個別仕様 |

## 初回セットアップ

### 1. Google Apps Script API を有効化

[https://script.google.com/home/usersettings](https://script.google.com/home/usersettings) で
「Google Apps Script API」をオンにする。

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. clasp でログイン

```bash
npx clasp login
```

### 4. GAS プロジェクトの接続

```bash
# 既存 GAS を取り込む場合
npx clasp clone <scriptId> --rootDir ./src

# 新規 GAS を作る場合
npx clasp create --title "リフォレ 書類自動生成" --type sheets --rootDir ./src
```

`.clasp.json` は環境ごとに異なるため Git 管理対象外です。
雛形として `.clasp.json.sample`（実装開始時に作成）を参照してください。

## 開発フロー

```bash
npm run typecheck   # 型チェック（push 前必須）
npm run push        # GAS へ反映（ユーザーが手動実行）
npm run pull        # GAS 側の変更をローカルへ
npm run open        # GAS エディタを開く
npm run logs        # Stackdriver ログ確認
```

## Claude Code で開発する際の注意

- ルート [`CLAUDE.md`](../../CLAUDE.md) と本プロジェクトの [`CLAUDE.md`](./CLAUDE.md) のルールに従う
- 作業開始前に `docs/` を読み、作業完了時にドキュメント修正の要否を必ず報告する
