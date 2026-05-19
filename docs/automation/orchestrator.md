# Orchestrator — refore-gas 自走ループ

このファイルは Claude Code の **scheduled task** から定期的に起動されたセッションが、毎回最初に読む自走プロンプトです。

## 実行モード

このループは **Anthropic クラウド上の scheduled task** として動きます:

- 起動間隔: 1 時間おき（変更時は scheduled task 側の cron も更新）
- 各実行は **独立したセッション**。前回のメモリは無く、`state.md` / `runs/` / `decisions/` から状態を復元する
- PC が閉じていても動く
- Slack 返信を拾うのは「次回起動時」（リアルタイム反応はしない）

`/loop dynamic` モード（同一セッション内で `ScheduleWakeup`）は使わない。各実行は1イテレーション分の作業を行って終了する。

---

## あなたの役割

refore-gas モノレポの未完了タスクを 1 イテレーションぶん進める。人間判断が必要な時は Slack に通知して止まり、次回起動時に Slack 返信を拾って再開する。

## 作業ディレクトリ

`/Users/taiseisuganuma/Project/refore-gas`

## refore-gas 固有の重要な制約（kumo-next と異なる点）

このモノレポは GAS（Google Apps Script）プロジェクトを集約している。以下の制約がある:

1. **`clasp push` / `clasp deploy` は絶対に実行しない**（[ルート CLAUDE.md](../../CLAUDE.md) 参照）
   - Claude はローカル TypeScript の編集と `npm run typecheck` 通過までで止まる
   - 実機反映はユーザーが手動で行う
2. **Google Docs テンプレを直接編集しない**（プロジェクト固有 CLAUDE.md 参照）
   - プレースホルダルールの変更が必要なら Slack で確認
3. **OAuth スコープ（`appsscript.json` の `oauthScopes`）を勝手に追加しない**
   - 追加が必要なら必ず Slack で確認
4. **既存関数シグネチャの変更（特に `Code.ts` のグローバル関数）は破壊的扱い**
   - `main`、`onOpen`、`doGet`、`doPost` 等は削除・改名禁止
5. **`import` / `export` 構文を使わない**（GAS は `module: none` でコンパイルするため）
6. **Node.js 専用ライブラリ（`fs`, `path`, `axios`, `lodash` 等）を使わない**
7. **「人間にしかできない作業」が頻出**（Drive 上のテンプレ作成・シート手動編集など）
   - これらは [`projects/document-generator/docs/phase1-user-tasks.md`](../../projects/document-generator/docs/phase1-user-tasks.md) のような専用ファイルでユーザー作業として明示されている
   - 自動化ループは **このユーザー作業が完了するのを待つ**

## 必ず守ること

- 作業ブランチは **`dev`** 固定。`main` には絶対 commit / push しない
- リポジトリのルール（ルート [`CLAUDE.md`](../../CLAUDE.md) と プロジェクトごとの `CLAUDE.md`）に従う
- 仕様書を変更した場合はルールに従って関連ドキュメントを更新する
- TodoWrite はこの自走ループでは使わない（state.md が真実の源、独立セッション間で引き継げない）
- **`git -C <path>` 形式を使い、`cd <path> && <cmd>` は使わない**（permission allowlist で deny されている）

## Slack 通知方針（厳しめ）

タスク種別ごとに通知レベルが違う。実装前に **このタスクがどの種別か** を判断する。

### A. インフラ・設定系（自走で進める）

該当する作業:
- ESLint / Prettier / tsconfig など開発ツールの設定追加
- ルート `package.json` の整備、`typecheck:all` などの横断 script 追加
- GitHub Actions workflow の追加
- `npm` 依存追加（既存と整合するもの。GAS で動くもの限定 = `@types/google-apps-script` 系・OCR や Office 系の純粋ライブラリのみ）
- `.gitignore` / `.editorconfig` 等の補助ファイル
- README の体裁統一

進め方:
- 仕様書に明記が無くても、業界標準で進めて OK
- ただし **GAS 固有制約**（V8 ランタイム、`module: none`、`import/export` 禁止など）に違反しないか必ず確認
- 完了時に Slack 通知（後述「完了報告」）

### B. GAS コード実装（仕様書に書いてあれば自走、書いてないことは Slack）

該当する作業:
- `src/Code.ts`、`src/services/`、`src/handlers/`、`src/types/` 等の TypeScript 実装
- パーサー・ハンドラーロジック
- メニュー・ダイアログ UI（HtmlService）

進め方:
- プロジェクトの `docs/specification.md`、`docs/placeholder-rules.md`（ある場合）、`docs/master-sheet-schema.md`（ある場合）を必ず読む
- **仕様書に書いてあること** → 自走で実装
- **仕様書に書いてない判断**（関数の細かい挙動・エラーメッセージ・正規表現の調整・型の細部・命名のブレ）→ Slack に質問して停止
- **「他コードから類推して決めた」は推測扱い** → Slack に質問
- ローカルで `npm run typecheck` が通ることを必ず確認

### C. 業務ロジック・データ整形（厳しめ。曖昧なら必ず Slack）

該当する作業:
- 案件パターン → 書類セット判定ロジック
- プレースホルダ置換のフォーマット（和暦変換・カンマ整形・敬称付与など）
- バリデーション（必須項目チェックなど）

進め方:
- 仕様書を **引用しながら** 実装する。コミットメッセージにどの章のどの記述を根拠にしたか書く
- 仕様書に明記が無いエッジケース（例: 空欄時の挙動、複数所有者、和暦切替の境界） → Slack に質問して停止
- **「現場運用ではこうだろう」と推測したら停止**

### D. テスト・ドキュメント整備（軽め判断、自走で OK）

該当する作業:
- 単体テスト追加（`*.test.ts`）
- README 加筆
- 仕様書の typo 修正

進め方:
- 既存パターンを踏襲
- テストの「期待値」が仕様書に書かれていない場合は B/C 扱いに格上げ

### 共通ルール

- どの種別でも、**コミットメッセージに「種別」と「仕様書のどこを根拠にしたか」** を明記する
- 「推測で進めた」と書きたくなった時点で停止して Slack に質問するのが正しい行動
- 安全側に倒す: 迷ったら Slack
- **GAS 制約違反のチェック**（`import` 構文・Node.js ライブラリ・OAuth スコープ無断追加）は必ず実装後に確認

---

## 安全ガード（クラウド実行のため重要）

実行を始める前に必ず確認:

1. **`state.md` の `paused: true`** → 何もせず終了
2. **`state.md` の `consecutive_failures` が 3 以上** → 何もせず終了（自動停止状態）
3. **`state.md` の `today_commits_date` が今日（JST）と一致しており、かつ `today_commits` が 30 以上** → 何もせず終了（暴走防止）

これらに該当した場合、Slack 通知は不要（既に過去のイテレーションで通知済み or 状態変化なし）。

「破壊的操作」が必要と判断した場合は **絶対に自走で進めない**。Slack に質問して停止:
- `clasp push` / `clasp deploy` / `clasp login`（refore-gas では実行禁止）
- Google Docs テンプレの直接編集
- `appsscript.json` の OAuth スコープ追加
- ファイル・ディレクトリの削除（無関係ファイルや構成変更含む）
- 既存関数シグネチャの変更（特に `Code.ts` のグローバル関数）
- 環境変数の変更
- 依存パッケージのメジャーアップグレード

---

## イテレーション開始時の手順

### 1. state.md を読む

[`state.md`](./state.md) の `paused`、`waiting_for`、`current_task`、`completed`、`skip`、`consecutive_failures`、`today_commits`、`today_commits_date`、`last_run_date` を確認する。

「安全ガード」のチェックを最初に行う。終了する場合はここで止まる。

**日付ロールオーバー処理**: `today_commits_date` が今日（JST）と異なる場合、`today_commits` を 0 にリセットし、`today_commits_date` を今日に更新する。

- `waiting_for: <slack_thread_ts>` → 次のセクション「2. Slack 待ちの解消」へ
- それ以外 → 次のセクション「3. 新規タスクの着手」へ

### 2. Slack 待ちの解消

`state.md` に `waiting_for: <ts>` がある場合:

1. `mcp__b45e988e-be8b-448e-b692-3076cceb680f__slack_read_thread` で `#dev-refore`（channel_id: `C0B4PCAKA6Q`）の該当スレッドを読む
2. 自分の最後の質問より後に人間からの返信があるか確認
3. **返信なし** → 何もせず終了（状態変化なし、Slack 通知不要）
4. **返信あり** →
   - 内容を解釈
   - `waits/<task-slug>.md` を `decisions/<YYYY-MM-DD>-<task-slug>.md` にリネーム移動し、回答内容を追記
   - `state.md` の `waiting_for` を空に
   - 元のタスクを再開（次のセクション 4「タスク実行」へ進む）

### 3. 新規タスクの着手

#### 3.1. タスク候補を集める

[`../schedule.md`](../schedule.md)（モノレポ全体の進捗管理）を読み、未完了 `- [ ]` を全部リストアップする。

**ユーザー作業ブロックの確認**: タスクが「ユーザー作業」セクション配下にある場合（例: `phase1-user-tasks.md` のテンプレ準備など）、それは Claude が触らない。スキップする。

#### 3.2. 既完了との重複チェック（重要）

タスク候補ごとに、以下のいずれかに該当しないか確認:

- `state.md` の `completed` に同じか類似の slug がある
- `decisions/` ディレクトリに対応する完了ログがある
- `runs/<日付>/` 配下の過去ログを確認

ヒットしたら **そのタスクは飛ばす**。schedule.md のチェックボックスを `- [x]` に変更し忘れているだけの可能性が高いので、その場合は `- [x]` に直してコミットだけして終了。

#### 3.3. 優先順位

候補の中から以下の優先順で1つ選ぶ:

1. **「現在地」セクションで指定された Phase のもの**（schedule.md 冒頭参照）
2. **state.md の `skip` リスト** に無いもの
3. **依存関係が解消されている**もの
4. **種別 A（インフラ・設定系）** を最優先、次に **D（テスト・ドキュメント整備）**、次に **B（GAS コード実装）**、最後に **C（業務ロジック）**
5. **タスクの粒度が「1イテレーションで完了しそう」**

#### 3.4. 粒度チェック（重要）

候補タスクが以下のいずれかに当てはまる場合、**1イテレーションで終わらないと判断**:
- schedule.md の表現が抽象的
- 仕様書を読んでもサブタスクへの分解が必要に見える
- 変更ファイル数が10を超えそう

→ **Slack で粒度分解を相談する**。サブタスクのリストアップと「最初にやるべきはどれか」を聞く。返信を待つ。自走で勝手にサブタスクを切らない。

タスクが選べたら `state.md` の `current_task` に slug を記録し、次のセクション 4 へ。

選べるタスクが無い場合（全完了 or 全 skip 該当 or 全ユーザー作業待ち or 全 Slack 待ち）→ **黙って終了**（Slack 通知も `paused` 変更もしない）。次のイテレーションで再判断する。

> document-generator Phase 1 のように「ユーザー作業待ちでブロック中」の状況は長期化する可能性がある。
> その場合は毎時起動して即終了する状態が続くだけで OK。

### 4. タスク実行

#### 4.1. 仕様書を読む

タスク種別ごとに該当章を読む（前述「Slack 通知方針」参照）。仕様書から該当箇所を抜粋してメモする。

#### 4.2. 実装

種別 B/C で「仕様書に書いてない判断」が必要になった瞬間、**実装を止めて Slack に質問**。途中まで書いたコードはコミットしない。`state.md` を更新して `waits/<task-slug>.md` を作り、終了。

#### 4.3. 検証

`npm run typecheck`（プロジェクトディレクトリ内で）を実行。失敗したら自分で直す（**最大 3 回**まで）。

**`clasp push` / `clasp deploy` は実行しない**。typecheck 通過までで止まる。

#### 4.4. それでもダメな場合

3 回直して通らない、または途中で仕様判断が必要 → Slack に質問、`waits/<task-slug>.md` 作成、`state.md` 更新、`current_task` はそのまま残して **このイテレーションは終了**。

タスクが正常完了したら次のセクション 5 へ。

### 5. ドキュメント更新

ルール:
- 仕様変更があれば該当 `projects/<name>/docs/*.md` を更新
- 当日の `runs/<YYYY-MM-DD>/<NNN>-<task-slug>.md` に実行内容を記録（1イテレーション = 1ファイル）

### 6. schedule.md の更新

完了したタスクの `- [ ]` を `- [x]` に変更。完了日も併記（既存スタイルに従う）: `- [x] タスク名 — 2026-MM-DD`

### 7. コミットと push

```bash
git -C /Users/taiseisuganuma/Project/refore-gas add <変更ファイル>
git -C /Users/taiseisuganuma/Project/refore-gas commit -m "<task-slug>: <概要>"
git -C /Users/taiseisuganuma/Project/refore-gas push origin dev
```

コミットメッセージのフォーマット:

```
<種別>(<scope>): <一行サマリ>

種別: A（インフラ）/ B（GAS コード）/ C（業務ロジック）/ D（テスト/ドキュメント）
仕様書根拠: <docs/xxx.md の該当章タイトル>（無ければ「なし（A 種別のため不要）」と明記）
変更概要:
- <bullet>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

- push に失敗した場合 → `git -C <path> pull --rebase origin dev` を試す。それで解決すれば再 push。それでもダメなら Slack 通知して `paused: true` で停止
- 強制 push は **絶対にしない**

### 8. state.md 更新

- `completed` リストにタスク slug と日付を追加
- `current_task` を空に
- `consecutive_failures` を 0 にリセット（タスク成功時）
- `last_run_date` を今日（JST）に
- `today_commits` をインクリメント

### 9. Slack 完了通知

以下に該当する時だけ `#dev-refore` に通知:

- タスクを1つ完了した → 「完了報告」
- Slack 待ちから復帰してタスク完了 → 「完了報告」
- `paused: true` で自動停止 → 「自動停止通知」
- 安全ガード発動 → 「自動停止通知」
- 粒度確認・仕様確認の質問 → 「質問テンプレ」

通知不要のケース:
- 何もせず終了（待ち継続、選べるタスクなし、ガード発動済み状態の継続、ユーザー作業待ち継続）

---

## Slack 通知のテンプレート

### 質問テンプレ

```
[refore-gas/<project>/<task-slug>] <一行サマリ>

## 種別
<A / B / C / D>

## 状況
<どこまでやって何で詰まったか>

## 仕様書の該当箇所
<projects/<name>/docs/xxx.md#章> から引用:
> <該当部分>

## 質問
<質問1>
<質問2>

## 選択肢（あれば）
- A: <案A>
- B: <案B>

## 推奨
<A or B、理由>。判断保留が必要なら「不明・要判断」と明記

返信フォーマット: 「A」「B」「やり直し: <自由記述>」のいずれか
```

### 完了報告

```
[refore-gas/<project>] <task-slug> 完了

種別: <A / B / C / D>
仕様書根拠: <章タイトル or "なし（A 種別）">
push: dev ブランチ <commit-hash>
変更: <ファイル数> ファイル / +<追加行数> -<削除行数>
当日コミット数: <today_commits>/30
```

### 自動停止通知

```
[refore-gas] 自動停止しました

理由: <連続失敗 3 回 / 本日コミット上限 30>
直前タスク: <task-slug>
再開方法: state.md の paused を false に戻してコミット
```

---

## エラー時の行動

- `npm run typecheck` が壊れた → 自分の変更が原因か切り分け、原因なら戻す、原因不明なら Slack
- git push が rejected → `git -C <path> pull --rebase origin dev` を試す、それでもダメなら Slack 通知して停止
- ファイル削除等の破壊的操作が必要 → 即停止、人間に確認
- 連続失敗が `state.md` の `consecutive_failures` を 3 にしたら、Slack 通知して `paused: true`
- permission denied になるコマンドが必要 → 該当コマンドを実行しない。代替手段があれば代替、無ければ Slack で許可を求める
- `clasp` コマンドが必要と判断 → 絶対に実行しない。Slack でユーザーに「clasp push が必要」と伝えて停止

---

## runs ログのフォーマット

**1イテレーション = 1ファイル**。`runs/<YYYY-MM-DD>/<NNN>-<task-slug>.md` に保存。

ファイル名例:
- `runs/2026-05-19/001-monorepo-typecheck-script.md`
- `runs/2026-05-19/002-doc-generator-types.md`

`<NNN>` はその日の通し番号（3桁ゼロ埋め）。

ログの中身フォーマット:

```markdown
# <task-slug>

## 種別
<A / B / C / D>

## プロジェクト
<document-generator / registry-ocr / モノレポ全体>

## 仕様書根拠
<docs/xxx.md の該当章。なければ「なし（理由）」>

## 実施内容
1. <step>
2. <step>

## 検証
- npm run typecheck: <結果>
- （該当する場合）他の検証コマンド

## ドキュメント更新
- <更新したファイル> または 「更新不要（理由）」

## コミット
- <hash> <subject>

## Slack 通知
<通知した内容のサマリ、または「なし」>
```

---

## 関連 channel

- `#dev-refore` = `C0B4PCAKA6Q`（このモノレポ用）
- `#dev-kumo` = `C0B4MK2EWRF`（kumo-next 用、このループでは使わない）
