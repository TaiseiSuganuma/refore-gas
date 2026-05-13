# registry-ocr

不動産登記簿 PDF を Google Apps Script (GAS) の OCR 機能でテキスト抽出し、
スプレッドシートへ自動入力するシステムです。

## 機能概要

- スプレッドシートのカスタムメニューからダイアログを起動
- ファイル選択 / ドラッグ＆ドロップで PDF をアップロード
- Google Drive Advanced Service の OCR で日本語テキストを抽出
- 正規表現で「所在・地番・地目・地積・所有者氏名」をパース
- アクティブシートの最終行に自動追記

---

## 初回セットアップ

### 1. Google Apps Script API を有効化する

[https://script.google.com/home/usersettings](https://script.google.com/home/usersettings) を開き、
「Google Apps Script API」をオンにしてください。これをしないと clasp が動作しません。

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. clasp でログイン

```bash
npm run login
# または
npx clasp login
```

ブラウザが開くので Google アカウントで認証してください。

---

## GAS プロジェクトの接続

### 既存の GAS を使う場合（clasp clone）

```bash
npx clasp clone <scriptId> --rootDir ./src
```

`scriptId` は GAS エディタの URL から取得できます（`/projects/<scriptId>/edit`）。

### 新規 GAS を作る場合（clasp create）

```bash
npx clasp create --title "不動産登記 OCR" --type sheets --rootDir ./src
```

### .clasp.json の rootDir を確認する

clasp clone / create 後、`.clasp.json` の `rootDir` が `./src` になっていることを確認してください。

```json
{
  "scriptId": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "rootDir": "./src"
}
```

> **注意**: このリポジトリでは `.clasp.json` を Git 管理対象外にしています（scriptId が環境ごとに異なるため）。
> 雛形として `.clasp.json.sample` を置いているので、コピーして scriptId を埋めてください。
> ```bash
> cp .clasp.json.sample .clasp.json
> # .clasp.json の "<YOUR_SCRIPT_ID>" を実際の scriptId に書き換える
> ```

---

## Drive Advanced Service の有効化（必須）

OCR に Google Drive API v2 を使用しています。
`clasp push` 後、GAS エディタから有効化してください。

1. GAS エディタを開く（`npm run open`）
2. 「サービス」の「＋」をクリック
3. 「Google Drive API」を選択 → バージョン「v2」 → 識別子「Drive」で追加

---

## 開発フロー

### 型チェック

```bash
npm run typecheck
```

push 前に必ず通過させてください。

### GAS へ反映（push）

```bash
npm run push
```

`src/` 配下のすべてのファイルを GAS プロジェクトへアップロードします。
`dialog.html` も `src/` に置いているため、自動でアップロードされます。

### その他のコマンド

```bash
npm run pull   # GAS 側の変更をローカルに取り込む
npm run open   # GAS エディタをブラウザで開く
npm run logs   # Stackdriver ログを確認する
```

---

## 運用ルール

- **GAS エディタ側で直接編集しない**。ローカルファイルが正とし、常に clasp push で反映する。
- もし GAS 側を直接変更してしまった場合は `npm run pull` でローカルに取り込んでから作業を再開する。

---

## OAuth スコープについて

このプロジェクトで使用しているスコープ:

| スコープ | 用途 |
|---|---|
| `spreadsheets` | シートへの追記 |
| `drive` | PDF の一時保存・OCR 変換・一時ファイル削除 |
| `documents` | OCR 変換後 Docs のテキスト読み出し |

**使わないスコープは `src/appsscript.json` から削除してください。**

---

## OCR パーサーについて

`src/services/registryParser.ts` に正規表現パーサーが実装されています。
OCR 結果のレイアウトはスキャン品質や登記所によって異なるため、
取得できなかった項目は「（取得できませんでした）」と表示されます。
必要に応じてパーサーの正規表現を調整してください。

---

## トリガー設定

このシステムはトリガー不要（手動実行のみ）です。
将来的にバッチ処理を追加する場合は GAS エディタの「トリガー」画面から設定してください。

---

## Claude Code で開発するときの注意点

- `CLAUDE.md` に GAS 開発ルールが定義されています。必ず参照してください。
- Node.js 専用 API（`fs`、`path`、`process` など）は使用できません。
- `import` / `export` は使用しません。名前空間（namespace）ベースで実装してください。
