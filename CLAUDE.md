# CLAUDE.md — GAS モノレポ共通の開発ルール

このリポジトリは複数の Google Apps Script (GAS) プロジェクトを集約したモノレポです。
Claude Code が `projects/` 配下で作業する際は、このファイルのルールを共通の前提として扱ってください。
各プロジェクト固有の仕様・運用は、各 `projects/<name>/CLAUDE.md` / `README.md` に従います。

## このリポジトリについて

- すべてのプロジェクトの実行環境は **Google のサーバー上の GAS ランタイム（V8）** です。Node.js アプリではありません。
- ローカルでは TypeScript で書き、`clasp push` で GAS へアップロードします。
- ディレクトリ命名は **kebab-case**（例: `registry-ocr`, `invoice-slack-workflow`）。

---

## ドキュメント駆動の作業フロー（最重要）

GAS プロジェクトを扱う際は、必ず以下のサイクルで作業すること。

### 1. 作業開始前に「読む」

該当プロジェクトの以下を確認し、現状仕様・既存制約・現在の進捗を把握する。

- [`docs/schedule.md`](./docs/schedule.md) — **進捗 & スケジュール（最初に読む。今動いている Phase と未完了タスクを把握）**
- [`docs/client-overview.md`](./docs/client-overview.md) — クライアント・案件全体の背景（業務文脈）
- `projects/<name>/README.md` — セットアップと利用方法
- `projects/<name>/docs/` 配下 — 仕様書（`specification.md` ほか）
- `projects/<name>/CLAUDE.md` — プロジェクト固有のルール・注意点
- このルート `CLAUDE.md` — GAS 共通ルール

ユーザーが「続きから」「次のタスクを進めて」と言ったら、`schedule.md` の「現在地」と未完了 `[ ]` タスクを確認してから動く。

ドキュメントが存在しない、または読み取り対象が曖昧な場合は、推測せずにユーザーに確認する。

### 2. 作業中に「ズレを検出する」

実装と仕様書の記述に食い違いを見つけた、もしくは仕様書に書かれていない判断を迫られた場合は、その場で立ち止まり、ユーザーに **「仕様書を更新するか / 実装を仕様書に合わせるか」** を確認する。仕様書を黙って正としても、実装を黙って正としてもいけない。

### 3. 作業完了時に「ドキュメント修正要否を必ず報告する」

機能追加・変更・削除・スコープ変更・依存サービス追加・パーサーや正規表現の挙動変更などを行った場合は、`docs/` 配下の関連ファイル・`README.md` を更新する。

**更新が不要だと判断した場合も、その判断を明示的に報告すること。** 「ドキュメント更新は不要（理由: …）」と一言添えるだけでよい。黙って完了扱いにしない。

更新対象の目安:

| 変更内容 | 更新すべきドキュメント |
|---|---|
| タスク完了 / Phase 進行 | `docs/schedule.md`（チェックボックスを `[x] (YYYY-MM-DD)` に更新、「現在地」も必要に応じて） |
| 機能追加・削除 | `docs/specification.md` の該当章、`README.md` の機能概要 |
| 入出力スキーマの変更 | `docs/specification.md` の入出力仕様 |
| OAuth スコープ変更 | `docs/specification.md` のスコープ表、`README.md` |
| パーサーの正規表現変更 | `docs/specification.md` のパーサー仕様 |
| シートのカラム構成変更 | `docs/specification.md` のシート仕様 |
| 依存 Advanced Service の追加 | `docs/specification.md`、`README.md` セットアップ手順 |

---

## 絶対に使わないもの

GAS 実行環境では存在しないため、コードに含めないでください。

- `fs`、`path`、`os`、`process`、`Buffer`、`require`、`__dirname`、`__filename`
- Node.js 専用の npm ライブラリ（`axios`、`lodash` など）
- `import` / `export` 構文（esbuild なしでは GAS で動作しない）

---

## 使うべき GAS API

| 用途 | 使う API |
|---|---|
| スプレッドシート操作 | `SpreadsheetApp` |
| Drive 操作 | `DriveApp` |
| 外部 HTTP 通信 | `UrlFetchApp` |
| HTML 返却 | `HtmlService` |
| JSON レスポンス | `ContentService` |
| UI（メニュー等） | `SpreadsheetApp.getUi()` |
| ログ出力 | `console.log` / `console.error`（Stackdriver に記録される） |

---

## ファイル構成と設計方針

- `module: none` で TypeScript をコンパイルするため、`import` / `export` は使わない
- 関数・型はすべて **namespace** または **グローバルスコープ** に置く
- `src/Code.ts` のグローバル関数（`main`、`onOpen`、`doGet`、`doPost`）は **削除・改名しない**
- 新しいエントリーポイントが必要な場合は `src/Code.ts` に追加する

---

## パフォーマンス・実行時間

- GAS の実行時間制限は **最大6分**（通常トリガーは6分、Web アプリは30秒）
- `SpreadsheetApp.getRange().getValue()` を繰り返し呼ぶ代わりに、`getValues()` で一括取得する
- `setValues()` で一括書き込みする。1セルずつの読み書きは絶対に避ける

```typescript
// 悪い例
for (let i = 1; i <= 100; i++) {
  const val = sheet.getRange(i, 1).getValue(); // 100回APIコール
}

// 良い例
const values = sheet.getRange(1, 1, 100, 1).getValues(); // 1回のAPIコール
```

---

## スコープ管理

- `src/appsscript.json` の `oauthScopes` を **勝手に追加しない**
- 新しいスコープが必要な場合は、理由を説明してユーザーに確認を取る

---

## 型チェック

- 実装後は必ず `npm run typecheck` が通ることを確認する
- 型エラーを `as unknown as XXX` で握り潰さない

---

## push / deploy はユーザーが実行する

- `clasp push` / `clasp deploy` / `clasp login` はユーザーが手動で実行する
- Claude Code はこれらのコマンドを実行しない

---

## 既存仕様を壊さない

- 既存の関数シグネチャ・動作を変更する場合は必ずユーザーに確認する
- リファクタリングを求められていない場合は、不必要な変更を加えない

---

## README の更新

- 機能追加・変更・スコープ変更を行った場合は、該当プロジェクトの `README.md` を更新する
