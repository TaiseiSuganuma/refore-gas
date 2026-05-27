# refore-gas 進捗 & スケジュール

refore-gas モノレポ全体の進捗管理ドキュメント。Claude も毎回これを最初に確認する。

- 完了したタスクには `[x]` をつける（完了日を併記）
- 未着手は `[ ]` のまま
- 「現在地」セクションで今何が動いているかを明示
- **進行中の Phase は個別タスクまで分解**、未着手の Phase はゴールと状態のみ

---

## 🎯 現在地

**document-generator / Phase 1 ユーザー作業完了 → Claude による GAS 実装着手可能**

シート編集（案件一覧 39 列・物件シート再設計・設定シート）、テストフォルダ作成、
テンプレコピー + プレースホルダ 21 個書き込みすべて完了（2026-05-27）。

成果物:
- Phase1出力先フォルダ: `01_Phase1動作確認用`（folderId: `1xinKhYODsvt1f4NppuZvgztuyeMovwnj`）
- Phase1テンプレ: コピー版【テンプレ】土地売買契約書（Docs ID: `1-OBdcMh34O1sRmdk0Ho0dJyyPz6lddp3egqQqxYn_zA`）

次回 scheduled task 起動時に Claude が Phase 1 MVP の GAS 実装に着手する。

> **設計変更（2026-05-27）**: Phase 2 以降の North Star を「1案件=1スプレッドシート」から
> **「1案件=1行+1フォルダ」の集約型バッチ運用**に変更。
> 詳細は [`specification.md` § 12 設計変更履歴](../projects/document-generator/docs/specification.md#12-設計変更履歴) 参照。
> Phase 1 自体（土地売買契約書 1 書類の単発生成）は変更なし。

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
- [x] 仕様書整備（refore-gas モノレポへの統合と docs/specification.md 作成） — 2026-05-14

### 今後

- [ ] document-generator Phase 5 で OCR ロジックを共有モジュール化（フォーム統合のため）

---

## document-generator

### North Star（目標形）

「フォーム入力 → 案件ごとのスプレッドシート＋フォルダ自動生成 → ダイアログから書類選択 → PDF出力」

詳細: [`projects/document-generator/docs/specification.md`](../projects/document-generator/docs/specification.md)

### Phase 0: 情報収集・仕様化 ✅ 完了

- [x] クライアント業務フロー把握（A 系統 = 仕入 / B 系統 = 売上、土地・立木の有無による分岐） — 2026-05-17
- [x] 案件マスタ実物確認（【リフォレ】書類自動生成: 案件一覧 / 明細 / 設定 / 見積書） — 2026-05-17
- [x] 出力書類リスト実物確認（リフォレ開発管理シート → 14 書類確定） — 2026-05-17
- [x] テンプレ実物確認（土地売買契約書 Docs） — 2026-05-17
- [x] 月次集計サンプル確認（20✕✕年✕月チェックリスト） — 2026-05-17
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

#### ユーザー作業（完了）

- [x] 「案件一覧」シートに 39 列のヘッダー確定（A〜AN、Phase 2 想定の最終形を一気に投入） — 2026-05-27
  - 案件IDから書類選択チェック列まで一括設定。サンプル案件 EST-20260309-001 を投入
- [x] 「明細」シート → 「物件」シートに再設計 — 2026-05-27
  - 11 列構成（案件ID / 物件No / 所在 / 地番 / 地目 / 面積 / 雑抜き / 樹種 / 樹高 / 金額 / 備考）
  - サンプル案件 EST-20260309-001 の 10 物件データを投入
- [x] 「設定」シートに項目追加 — 2026-05-27
  - Phase1テンプレID_土地売買契約書 / Phase1出力先フォルダID / 物件シート名 等
- [x] Phase 1 用テストフォルダ `01_Phase1動作確認用` の作成 + 設定シートに folderId 登録 — 2026-05-27
  - folderId: `1xinKhYODsvt1f4NppuZvgztuyeMovwnj`
- [x] テンプレ「土地売買契約書」のコピー作成 + プレースホルダ書き込み（21 個） — 2026-05-27
  - 指示書: [`purchase_contract_land_placeholders.md`](../projects/document-generator/docs/documents/purchase_contract_land_placeholders.md)
  - Docs ID: `1-OBdcMh34O1sRmdk0Ho0dJyyPz6lddp3egqQqxYn_zA`
  - Claude が Drive MCP で書き込み内容を検証済み（プレースホルダ 21 個すべて正しく挿入されていることを確認）

#### Claude 実装（ユーザー作業完了後）

- [x] `.clasp.json.sample` の作成、`appsscript.json` のスコープ設定 — 2026-05-27
- [x] `src/types/index.ts`: ContractContext 等の型定義 — 2026-05-27
- [ ] `src/services/sheetService.ts`: 案件一覧・物件・設定シート読み込み
- [ ] `src/services/templateService.ts`: Docs テンプレ複製・PDF 化
- [ ] `src/services/placeholderService.ts`: `{{key}}` 置換と和暦・カンマ整形
- [ ] `src/handlers/documentHandler.ts`: 全体オーケストレーション
- [ ] `src/Code.ts`: `onOpen` メニュー、`generateLandPurchaseContract` エントリ
- [ ] 動作確認とログ整備
- [ ] 仕様書の実装内容反映（specification.md「関連ファイル一覧」の更新）

### Phase 2: 新方式（バッチ型・集約型運用） 📅 未着手

> **設計変更**: 2026-05-27 に North Star を「1案件=1スプレッドシート」から「1案件=1行+1フォルダ」に変更（[specification.md § 12](../projects/document-generator/docs/specification.md#12-設計変更履歴) 参照）。Phase 2 は新方針の中核実装。

**ゴール**: 案件マスタ 1 シートに全案件を集約し、月末に複数案件×複数書類をまとめて出力できる状態。

主な内容:
- 案件マスタ列拡張（行頭選択チェックボックス、案件パターン列、書類列 14、ステータスプルダウン、フォルダURL）
- 書類マスタシート新設
- メニュー「書類発行」→ バッチ処理（選択行抽出 → 書類列 ON のみ生成）
- パターン選択時の `onEdit` で書類列の初期チェック自動投入
- 案件フォルダ自動作成（`案件/YYYY/MM/<案件ID>_<地域>_<相手方名>/`）
- 同名 PDF があれば `_v2`, `_v3` の suffix
- ステータス自動更新（「未着手」→「出力済み」）

### Phase 3: 明細繰返し対応 + 残契約書実装 📅 未着手

**ゴール**: 物件明細を表として差し込む処理を実装。A①/A②/B①/B② 4 契約書を実装。

### Phase 4: Google フォーム連携 📅 未着手

**ゴール**: 新規案件を Google フォームから入力。`onFormSubmit` トリガーで案件 ID 採番 → 案件マスタに 1 行追記 → 案件フォルダ作成。

主な内容:
- Google フォーム作成（案件パターン込みの入力 UI）
- `onFormSubmit` ハンドラ実装
- マスタへの冪等な追記処理（重複防止）
- フォルダ URL の自動セット

### Phase 5: OCR 統合 📅 未着手

**ゴール**: フォームに登記簿 PDF 添付欄を追加。registry-ocr のロジックで自動抽出 → 案件マスタに自動投入。

### Phase 6: 月次レポート + 残り書類 📅 未着手

**ゴール**: 月次チェックリスト自動生成。見積書・請求書・売上計算シート対応。

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
