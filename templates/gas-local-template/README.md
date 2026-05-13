# gas-local-template

Google Apps Script をローカルで TypeScript 管理し、clasp でデプロイするためのテンプレートです。

## 目的

- GAS の Web エディタを直接編集せず、ローカルファイルを Git 管理する
- TypeScript で型補完・型チェックしながら開発する
- clasp を通じて Apps Script へ反映する

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
npx clasp create --title "プロジェクト名" --type standalone --rootDir ./src
```

`--type` は用途に応じて変更してください（`standalone` / `sheets` / `webapp` など）。

### .clasp.json の rootDir を確認する

clasp clone / create 後、`.clasp.json` の `rootDir` が `./src` になっていることを確認してください。

```json
{
  "scriptId": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "rootDir": "./src"
}
```

なっていない場合は手動で修正してください。

> **注意**: `.clasp.json` はこのテンプレートでは Git 管理対象としています。
> ただし、スクリプト ID を公開したくない案件では `.gitignore` に追加することを検討してください。

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

`src/` 配下のファイルを GAS プロジェクトへアップロードします。

### デプロイ

```bash
npm run deploy
```

Web アプリとして公開する場合や、バージョンを切る場合に使います。

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

`src/appsscript.json` に定義されたスコープはテンプレートとして広めに設定しています。
**実際に使わないスコープは削除してください。** 最小権限の原則に従い、必要なスコープのみに絞ることを推奨します。

現在設定されているスコープ:

| スコープ | 用途 |
|---|---|
| `spreadsheets` | スプレッドシートの読み書き |
| `drive` | Google Drive の操作 |
| `script.external_request` | `UrlFetchApp` による外部 HTTP リクエスト |

---

## トリガー設定

時間ベースやスプレッドシートイベントなどのトリガーは、GAS エディタの「トリガー」画面から設定します。
トリガーはコードに含まれないため、README やコメントに設定内容を記録しておくことを推奨します。

---

## Claude Code で開発するときの注意点

- このリポジトリには `CLAUDE.md` があり、Claude Code 向けのルールが記載されています。
- `CLAUDE.md` の内容に従って作業してください。
- Node.js 専用 API（`fs`、`path`、`process` など）は使用できません。GAS の API を使ってください。
