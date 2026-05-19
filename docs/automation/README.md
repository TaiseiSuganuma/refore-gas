# 自動化ループ運用ドキュメント

このディレクトリは、Claude Code が refore-gas モノレポの未完了タスクを自走で進めるための運用ファイル群です。

## 構成

| ファイル / フォルダ                    | 役割                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------ |
| [`orchestrator.md`](./orchestrator.md) | Claude が毎イテレーション最初に読む自走プロンプト本体                    |
| [`state.md`](./state.md)               | 直近の状態（現在着手中タスク・Slack 待ち・完了履歴・失敗カウンタ・本日コミット数） |
| [`runs/`](./runs/)                     | 実行ログ。`<YYYY-MM-DD>/<NNN>-<task-slug>.md` の形式で1イテレーション=1ファイル |
| [`decisions/`](./decisions/)           | 人間判断ログ。Slack で確定した判断を記録                                 |
| [`waits/`](./waits/)                   | Slack 返信待ち中の質問内容を一時保管。返信が解けたら `decisions/` に移動 |

## 実行モード

**Anthropic クラウド上の scheduled task として 1 時間おきに動きます。PC を閉じてもクラウド側で動くため、外出先で Slack に返信すれば次回起動時に拾われて作業が進みます。**

- 各実行は独立したセッション。前回のメモリは無く、`state.md` から状態復元
- Slack 返信のリアルタイム反応はしない（次回起動時に拾う、最大ラグ約1時間）
- 安全ガード: 連続失敗3回 / 1日コミット30件 / paused=true で自動停止

## refore-gas 固有の制約

GAS モノレポという性質上、以下が **絶対 NG**:

- `clasp push` / `clasp deploy` — 実機反映は必ずユーザーが手動
- Google Docs テンプレの直接編集
- `appsscript.json` の OAuth スコープ無断追加
- `import` / `export` 構文の使用（GAS は `module: none`）
- Node.js 専用ライブラリ（`fs`, `axios` 等）の利用

詳細は [`orchestrator.md`](./orchestrator.md) の「refore-gas 固有の重要な制約」セクション参照。

## Slack 通知方針（厳しめ）

タスク種別ごとに通知レベルが変わります。詳細は [`orchestrator.md`](./orchestrator.md) の「Slack 通知方針」セクション参照。

- **A. インフラ・設定系** → 自走で進める（GAS 制約違反だけ要注意）
- **B. GAS コード実装** → 仕様書に書いてあれば自走、書いてない判断は Slack
- **C. 業務ロジック** → 仕様書を引用しながら実装、曖昧なら Slack
- **D. テスト・ドキュメント整備** → 純粋なら自走、期待値判断が絡んだら B/C 扱い

## 現状（土台のみ稼働）

document-generator Phase 1 はユーザー作業待ち（[`phase1-user-tasks.md`](../../projects/document-generator/docs/phase1-user-tasks.md)）。
その間、自動化ループは **着手できるタスクが無ければ毎時起動して即終了する**状態が続きます。これは正常動作です。

ユーザー作業が完了したら、`docs/schedule.md` の該当チェックを `[x]` に更新してコミット → 次の起動時に Claude が拾います。

## 起動方法（通常運用）

設定後は自動。手動が必要なときだけ以下:

- **停止**: `state.md` の `paused` を `true` に変更してコミット → 次回起動時に何もせず終了
- **再開**: `state.md` の `paused` を `false` に戻してコミット
- **手動キック**: Claude Code 内で scheduled-tasks から `Run now`

## scheduled task 設定

- task ID: `refore-gas-autonomous-loop`
- cron: `0 * * * *`（毎時 0 分、ローカルタイム）
- prompt: orchestrator.md の指示に従って 1 イテレーションを実行

## 関連

- ルート ルール: [`../../CLAUDE.md`](../../CLAUDE.md)
- 進捗管理の真実の源: [`../schedule.md`](../schedule.md)
- クライアント全体ドキュメント: [`../client-overview.md`](../client-overview.md)
