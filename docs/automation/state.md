---
paused: false
current_task: null
waiting_for: null
last_run_date: "2026-05-27"
consecutive_failures: 0
today_commits: 3
today_commits_date: "2026-05-27"
---

# 自走ループ状態

## 完了タスク

- `clasp-json-sample-and-oauth-scopes` — 2026-05-27
  `.clasp.json.sample` 作成・appsscript.json スコープ設定（documents, script.container.ui 追加）
- `types-contract-context` — 2026-05-27
  `src/types/index.ts`: CaseRow / PropertyRow / Settings / LandPurchaseContractContext 等の型定義（Phase 1 MVP 向け）
- `sheet-service` — 2026-05-27
  `src/services/sheetService.ts`: 案件一覧・物件・設定シート読み込み実装（getSettings / getAllCaseRows / getCaseRowById / getActiveCaseRow / getPropertyRowsByCaseId）

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
- 現状: document-generator Phase 1 ユーザー作業完了（2026-05-27）。Claude 実装タスク進行中（types 完了、sheetService 完了、次は templateService）。
