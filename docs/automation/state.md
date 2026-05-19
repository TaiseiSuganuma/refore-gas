---
paused: false
current_task: null
waiting_for: null
last_run_date: null
consecutive_failures: 0
today_commits: 0
today_commits_date: null
---

# 自走ループ状態

## 完了タスク

（自走ループ開始前。今後 Claude が自動で追加）

## skip リスト

人間判断で「このループでは自走させない」と決めたタスク。Claude は schedule.md にあっても着手しない。

- `clasp push` / `clasp deploy` を伴う作業（必ず人間が手動実行）
- Google Docs テンプレの直接編集
- `appsscript.json` の OAuth スコープ追加
- Phase 1 ユーザー作業（テンプレ準備・シート編集・テストフォルダ作成など）— [`phase1-user-tasks.md`](../../projects/document-generator/docs/phase1-user-tasks.md) は完全に人間担当

## メモ

- 実行モード: scheduled task（クラウド、1時間おき）
- 起動方式: 各実行は独立セッション。orchestrator.md と state.md から状態復元する
- 安全ガード: 連続失敗3回 / 1日コミット30件 / paused=true で自動停止
- Slack 通知方針: 厳しめ（種別 B/C は仕様書に書いてないことを推測しない、必ず Slack で確認）
- 現状: document-generator Phase 1 はユーザー作業待ち。その間、自動化ループは
  「ユーザー作業ではなく、かつ Claude が自走可能」なタスク（モノレポ横断のインフラ系など）を探す。
  該当タスクが無ければ毎時起動して即終了する状態が続く（正常動作）
