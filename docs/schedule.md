# refore-gas 進捗 & スケジュール

refore-gas モノレポ全体の進捗管理ドキュメント。Claude も毎回これを最初に確認する。

- 完了したタスクには `[x]` をつける（完了日を併記）
- 未着手は `[ ]` のまま
- 「現在地」セクションで今何が動いているかを明示
- **進行中の Phase は個別タスクまで分解**、未着手の Phase はゴールと状態のみ

---

## 🎯 現在地

**document-generator / Phase 1 着手前**

ユーザーのシート編集作業（[`phase1-user-tasks.md`](../projects/document-generator/docs/phase1-user-tasks.md)）の完了待ち。
完了報告を受けたら Claude が Phase 1 MVP の GAS 実装に着手する。

---

## プロジェクト全体マップ

| プロジェクト | 役割 | 状態 |
|---|---|---|
| [registry-ocr](../projects/registry-ocr/) | 不動産登記簿 PDF の OCR 転記 | ✅ 運用中（v1） |
| [document-generator](../projects/document-generator/) | 案件確定時の書類自動生成（モノレポの主要案件） | 🚧 Phase 1 準備中 |

---

## registry-ocr

### v1（リリース済み）

- [x] OCR エンジン実装（Drive Advanced Service v2） — 2026-04-27
- [x] スプレッドシートメニュー連携 — 2026-04-27
- [x] 仕様書整備 — 2026-05-15

### 今後

- [ ] document-generator Phase 5 で OCR ロジックを共有モジュール化（フォーム統合のため）

---

## document-generator

### North Star（目標形）

「フォーム入力 → 案件ごとのスプレッドシート＋フォルダ自動生成 → ダイアログから書類選択 → PDF出力」

詳細: [`projects/document-generator/docs/specification.md`](../projects/document-generator/docs/specification.md)

### Phase 0: 情報収集・仕様化 ✅ 完了

- [x] クライアント業務フロー把握（A 系統 / B 系統） — 2026-05-17
- [x] マスタシート実物確認（案件一覧 / 明細 / 設定 / 見積書） — 2026-05-17
- [x] テンプレ実物確認（土地売買契約書） — 2026-05-17
- [x] 14 書類リストの確定 — 2026-05-17
- [x] North Star と 7 Phase ロードマップ確定 — 2026-05-17
- [x] 月次集計設計の組み込み（案件マスタを Source of Truth に） — 2026-05-17

### Phase 1: 土地売買契約書 MVP 🚧 進行中

**ゴール**: 既存「案件一覧」シートからアクティブ行を選び、「土地売買契約書」1書類を PDF 出力できる状態。

#### 設計・準備

- [x] テンプレへのプレースホルダ挿入案を作成（21個） — 2026-05-17
  - 成果物: [`documents/purchase_contract_land_placeholders.md`](../projects/document-generator/docs/documents/purchase_contract_land_placeholders.md)
- [x] 案件一覧シートの不足列の扱いを決定（シート編集前提） — 2026-05-17
- [x] Phase 1 の出力先フォルダ方針を決定（テストフォルダ新設） — 2026-05-17
  - 指示書: [`phase1-user-tasks.md`](../projects/document-generator/docs/phase1-user-tasks.md)

#### ユーザー作業（待機中）

- [ ] テンプレ「土地売買契約書」のコピー作成 + プレースホルダ書き込み
- [ ] 「案件一覧」シートに 6 列追加（契約日 / 売主名義人 / 売主続柄 / 手付金 / 口座名義カナ / 支払予定日）
- [ ] 「明細」シートを「物件」シートに再設計（所在・地番・地目を独立列に）
- [ ] 「設定」シートに項目追加（出力先フォルダID / 物件シート名 / Phase1テンプレID）
- [ ] Phase 1 用テストフォルダ `01_Phase1動作確認用` の作成

#### Claude 実装（ユーザー作業完了後）

- [ ] `.clasp.json.sample` の作成、`appsscript.json` のスコープ設定
- [ ] `src/types/index.ts`: ContractContext 等の型定義
- [ ] `src/services/sheetService.ts`: 案件一覧・物件・設定シート読み込み
- [ ] `src/services/templateService.ts`: Docs テンプレ複製・PDF 化
- [ ] `src/services/placeholderService.ts`: `{{key}}` 置換と和暦・カンマ整形
- [ ] `src/handlers/documentHandler.ts`: 全体オーケストレーション
- [ ] `src/Code.ts`: `onOpen` メニュー、`generateLandPurchaseContract` エントリ
- [ ] 動作確認とログ整備
- [ ] 仕様書の実装内容反映（specification.md「関連ファイル一覧」の更新）

### Phase 2: 複数書類同時出力 + パターン判定 📅 未着手

**ゴール**: 案件パターン（A①〜B②）に応じて必要書類セットを自動選択、複数 PDF を同時生成。

主な内容:
- 案件一覧に「案件パターン」列追加
- 書類マスタシート新設
- 複数選択ダイアログ UI

### Phase 3: 明細繰返し対応 + 残契約書実装 📅 未着手

**ゴール**: 物件明細を表として差し込む処理を実装。A①/A②/B①/B② 4 契約書を実装。

### Phase 4: フォーム → サマリーシート自動生成 + 集計基盤 📅 未着手

**ゴール**: フォーム送信から案件サマリーシート自動生成。案件マスタへの onEdit 自動転記で月次集計の基盤を構築。

### Phase 5: OCR 統合 📅 未着手

**ゴール**: フォームに登記簿 PDF 添付欄を追加。registry-ocr のロジックで自動抽出。

### Phase 6: 月次レポート + 残り書類 📅 未着手

**ゴール**: 月次チェックリスト自動生成。見積書・請求書・法務局関連・社内シート対応。

### Phase 7+: 運用フィードバック反映 📅 未着手

---

## 運用ルール

### このドキュメントの更新タイミング

- **タスク完了時**: そのタスクの行を `[ ]` → `[x] (YYYY-MM-DD)` に更新
- **Phase 切り替え時**: 「現在地」セクションを書き換え、新 Phase のタスクを詳細化
- **ロードマップ変更時**: 該当 Phase の説明とゴールを更新

### Claude の使い方

会話開始時に Claude は:
1. このファイル (`docs/schedule.md`) を最初に読む
2. 「現在地」で今動いている Phase を把握
3. ユーザーが「続きから」と言ったら、未完了の `[ ]` タスクを上から実行する
4. タスク完了後はチェックを更新してコミット

### このドキュメントに書かないこと

- 詳細な仕様 → `projects/<name>/docs/specification.md`
- ユーザーへの手順説明 → `phase1-user-tasks.md` 等の専用ファイル
- セッション中の一時的な作業ログ → Claude の TaskCreate（揮発）
