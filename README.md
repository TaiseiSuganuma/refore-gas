# refore-gas

リフォレ社内業務の自動化に使う Google Apps Script (GAS) プロジェクトを集約したモノレポです。
ローカルで TypeScript + [clasp](https://github.com/google/clasp) を用いて開発し、GAS へデプロイします。

> **作業開始前に [`docs/schedule.md`](./docs/schedule.md) で現在の進捗を確認してください。**
> 全プロジェクトの Phase 進行状況とチェックボックス形式のタスクを管理しています。
>
> **クライアント・案件全体の背景は [`docs/client-overview.md`](./docs/client-overview.md) を参照してください。**

## ディレクトリ構成

```
refore-gas/
├── docs/
│   ├── schedule.md           # 進捗 & スケジュール（最初に確認）
│   └── client-overview.md    # クライアント・案件全体のドキュメント
├── projects/                 # 実プロジェクト群（GAS 1 つ = 1 ディレクトリ）
│   ├── registry-ocr/         # 不動産登記簿 PDF を OCR してシートへ転記
│   │   ├── README.md
│   │   ├── docs/             # 仕様書
│   │   └── src/
│   └── document-generator/   # 案件確定時の書類自動生成（Phase 0: 仕様化中）
│       ├── README.md
│       ├── docs/
│       └── src/
└── templates/
    └── gas-local-template/   # 新規 GAS プロジェクトの雛形
```

各プロジェクトの **仕様書は `projects/<name>/docs/`** に置きます。GitHub 上で直接プレビューしてください。

## 新しい GAS プロジェクトを追加する

```bash
cp -r templates/gas-local-template projects/<new-project>
cd projects/<new-project>
npm install
npx clasp login          # 未ログインの場合
npx clasp create --title "<タイトル>" --type sheets --rootDir ./src
# または既存 GAS を取り込む場合
# npx clasp clone <scriptId> --rootDir ./src
```

ディレクトリ名は **kebab-case** を使用します（例: `registry-ocr`, `invoice-slack-workflow`）。

## 共通の開発ルール

GAS 開発時の共通ルールはルート [`CLAUDE.md`](./CLAUDE.md) に定義しています。
プロジェクト固有の仕様は各プロジェクトの `README.md` / `CLAUDE.md` を参照してください。

## clasp 認証情報の扱い

- `.clasp.json` は scriptId が個人/環境ごとに異なるためコミットしません（`.gitignore` で除外済み）。
- 各プロジェクトには `.clasp.json.sample` を置き、必要なキーを共有します。
- `clasp login` で生成される `~/.clasprc.json` も同様にコミットしません。
