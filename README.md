# refore-gas

リフォレ社内業務の自動化に使う Google Apps Script (GAS) プロジェクトを集約したモノレポです。
ローカルで TypeScript + [clasp](https://github.com/google/clasp) を用いて開発し、GAS へデプロイします。

## ディレクトリ構成

```
refore-gas/
├── projects/                 # 実プロジェクト群（GAS 1 つ = 1 ディレクトリ）
│   └── registry-ocr/         # 不動産登記簿 PDF を OCR してシートへ転記
└── templates/
    └── gas-local-template/   # 新規 GAS プロジェクトの雛形
```

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
