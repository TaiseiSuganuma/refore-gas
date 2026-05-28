# refore-gas 進捗 & スケジュール

refore-gas モノレポ全体の進捗管理ドキュメント。Claude も毎回これを最初に確認する。

- 完了したタスクには `[x]` をつける（完了日を併記）
- 未着手は `[ ]` のまま
- 「現在地」セクションで今何が動いているかを明示
- **進行中の Phase は個別タスクまで分解**、未着手の Phase はゴールと状態のみ

---

## 🎯 現在地

**document-generator / Phase 3 実装完了 → ユーザーによる `clasp push` & 段階的動作確認待ち**

Phase 3（明細繰返し展開・A①/A²/B¹/B² 4 契約書 + 法務局 6 書類の Context ビルダー・batchHandler 全 14 書類ディスパッチ）の実装が完了（2026-05-28）。typecheck 通過済み。

次のステップ:
1. ユーザーが `npm run build && clasp push`
2. 書類マスタの「有効」列を 1 書類ずつ TRUE に切り替えて動作確認
3. B 系統書類は案件一覧の `買主取引先ID` を、法務局書類は `代理人ID` と Phase 3 用 5 列に値を入れる

詳細は [`docs/schedule.md` Phase 3 セクション](./schedule.md#phase-3-明細繰返し対応--残契約書--法務局書類--実装完了--動作確認待ち) 参照。

> **設計変更（2026-05-27）**: Phase 2 以降の North Star を「1案件=1スプレッドシート」から
> **「1案件=1行+1フォルダ」の集約型バッチ運用**に変更。
> 詳細は [`specification.md` § 12 設計変更履歴](../projects/document-generator/docs/specification.md#12-設計変更履歴) 参照。

> **設計変更（2026-05-27 その2）**: 出力書類リスト（14 書類の【原本】【テンプレ】Docs URL）を
> スプレッドシート内「出力書類リスト」シートに移行。あわせて取引先マスタ・代理人マスタを Phase 2 で新設し、
> 伐採業者・買主・代理人をマスタ参照型に切り替える。
> 詳細は [`master-sheet-schema.md` § 9〜11](../projects/document-generator/docs/master-sheet-schema.md) 参照。

---

## プロジェクト全体マップ

| プロジェクト | 役割 | 状態 |
|---|---|---|
| [registry-ocr](../projects/registry-ocr/) | 不動産登記簿 PDF の OCR 転記 | ✅ 運用中（v1） |
| [document-generator](../projects/document-generator/) | 案件確定時の書類自動生成（モノレポの主要案件） | 🚧 Phase 3 実装完了 / 動作確認待ち |

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

### Phase 1: 土地売買契約書 MVP ✅ 完了

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
  - Phase1テンプレID_土地売買契約書 / 共通PDF出力先親フォルダID / 物件シート名 等
- [x] Phase 1 用テストフォルダ `01_Phase1動作確認用` の作成 + 設定シートに folderId 登録 — 2026-05-27
  - folderId: `1xinKhYODsvt1f4NppuZvgztuyeMovwnj`
- [x] テンプレ「土地売買契約書」のコピー作成 + プレースホルダ書き込み（21 個） — 2026-05-27
  - 指示書: [`purchase_contract_land_placeholders.md`](../projects/document-generator/docs/documents/purchase_contract_land_placeholders.md)
  - Docs ID: `1-OBdcMh34O1sRmdk0Ho0dJyyPz6lddp3egqQqxYn_zA`
  - Claude が Drive MCP で書き込み内容を検証済み（プレースホルダ 21 個すべて正しく挿入されていることを確認）

#### Claude 実装（ユーザー作業完了後）

- [x] `.clasp.json.sample` の作成、`appsscript.json` のスコープ設定 — 2026-05-27
- [x] `src/types/index.ts`: ContractContext 等の型定義 — 2026-05-27
- [x] `src/services/sheetService.ts`: 案件一覧・物件・設定シート読み込み — 2026-05-27
- [x] `src/services/templateService.ts`: Docs テンプレ複製・PDF 化 — 2026-05-27
- [x] `src/services/placeholderService.ts`: `{{key}}` 置換と和暦・カンマ整形 — 2026-05-27
- [x] `src/handlers/documentHandler.ts`: 全体オーケストレーション — 2026-05-27
- [x] `src/Code.ts`: `onOpen` メニュー、`generateLandPurchaseContract` エントリ — 2026-05-27
- [x] clasp v3 対応のビルド構成（tsconfig.build.json + dist/ ベース + npm run build/push） — 2026-05-28
- [x] 初回 clasp push（9 ファイル） — 2026-05-28
- [x] スプレッドシートでメニュー動作確認（ユーザーが実施） — 2026-05-28
- [x] 仕様書の実装内容反映（specification.md「関連ファイル一覧」の更新） — 2026-05-27

### Phase 2: 新方式（バッチ型・集約型運用） ✅ 完了（2026-05-28）

> **設計変更**: 2026-05-27 に North Star を「1案件=1スプレッドシート」から「1案件=1行+1フォルダ」に変更（[specification.md § 12](../projects/document-generator/docs/specification.md#12-設計変更履歴) 参照）。Phase 2 は新方針の中核実装。

**ゴール**: 案件マスタ 1 シートに全案件を集約し、月末に複数案件×複数書類をまとめて出力できる状態。

#### ユーザー作業（GAS 実装前に必要）

手順書: [`phase2-user-tasks.md`](../projects/document-generator/docs/phase2-user-tasks.md)

- [x] 作業1: 「案件一覧」シートに 44 列を投入（選択☑・案件パターン・書類列×14・合計集計列など Phase 2 想定の全列） — 2026-05-27
- [x] 作業2: 「書類マスタ」シート整備（旧「出力書類リスト」をリネーム、14 書類の【原本】【テンプレ】メタデータ投入） — 2026-05-28
- [x] 作業3: 「取引先マスタ」シート新設（PARTNER-001 株式会社 陽 を投入） — 2026-05-28
- [x] 作業4: 「代理人マスタ」シート新設（データは空） — 2026-05-28
- [x] 作業5: 「案件一覧」シートに **取引先 ID 3 列**（売主取引先ID / 買主取引先ID / 代理人ID）を末尾に追加 — 2026-05-28
- [x] 作業6: 「書類マスタ」シートに **GAS 用 4 列**（書類ID / 対応パターン / ファイル名テンプレ / 有効）を追加（15 行に拡張済み） — 2026-05-28
- [x] 作業7: 「設定」シートに **シート名 4 項目** を追加（書類マスタシート名 / 取引先マスタシート名 / 代理人マスタシート名 / 選択列名） — 2026-05-28

#### Claude 実装

- [x] `src/types/index.ts` 拡張: Phase 2 型定義（DocumentMasterRow, PartnerRow, AgentRow, BatchResult, CaseRowPhase2Extension） — 2026-05-28
- [x] `src/services/documentMasterService.ts`: 書類マスタ読み込み（findByName / getEnabledRowById / getMatchingDocuments / extractFileIdFromUrl） — 2026-05-28
- [x] `src/services/partnerMasterService.ts`: 取引先マスタ読み込み（getById） — 2026-05-28
- [x] `src/services/agentMasterService.ts`: 代理人マスタ読み込み（getById、利用は Phase 3 から） — 2026-05-28
- [x] `src/services/projectFolderService.ts`: 案件フォルダ自動作成（`案件/YYYY/MM/<案件ID>_<地域>_<相手方名>/`） — 2026-05-28
- [x] `src/services/versionedNameService.ts`: 同名 PDF に `_v2`, `_v3` suffix — 2026-05-28
- [x] `src/services/templateService.ts` 拡張: `generatePdfToFolder` 追加（呼出側でフォルダ・ファイル名指定可） — 2026-05-28
- [x] `src/services/sheetService.ts` 拡張: 選択行抽出 / ヘッダー列マップ / ステータス更新 / 書類列抽出 — 2026-05-28
- [x] `src/handlers/batchHandler.ts`: 複数案件×複数書類のバッチ処理オーケストレーション — 2026-05-28
- [x] `src/handlers/onEditHandler.ts`: 案件パターン列 onEdit → 書類列初期チェック投入 — 2026-05-28
- [x] `src/Code.ts` 更新: メニュー「書類発行（バッチ・Phase 2）」追加、onEdit トリガー登録 — 2026-05-28
- [x] typecheck 通過確認・仕様書更新・schedule.md 更新 — 2026-05-28
- [x] 動作確認（ユーザーが `npm run build && clasp push` 後に実施） — 2026-05-28

> **Phase 2 完了条件**: 既存サンプル案件 `EST-20260309-001` を「選択」=TRUE にして「書類発行」メニュー実行 →
> 土地売買契約書 PDF が案件フォルダ `案件/2026/06/EST-20260309-001_南さつま_佐藤てるお/` に生成され、
> 案件一覧のステータスが「出力済み」、フォルダURL が自動セットされること。

#### Phase 2 で実装しない範囲（Phase 3 以降に持ち越し）

- A①/A²/B¹/B² 契約書 + 法務局 5 書類のプレースホルダ Context ビルダー（書類マスタで「有効」=FALSE のままなのでバッチでスキップされる）
- 物件明細の繰返し差込（`{{#each items}}`）
- 案件フォルダ専用ダイアログ（現状は SpreadsheetApp.getUi().alert で代用）

### Phase 3: 明細繰返し対応 + 残契約書 + 法務局書類 🚧 実装完了 / 動作確認待ち

> **方針変更（2026-05-28）**: クライアントに早めに見せるため、法務局関連 5 書類も Phase 3 に前倒し（旧計画では Phase 6）。

**ゴール**: 物件明細を表として差し込む処理を実装。A①/A²/B¹/B² 4 契約書 + 法務局関連 5 書類を実装。

#### ユーザー作業

- [x] 案件一覧に **法務局用 5 列**（売主生年月日 / 売主旧住所 / 売主新住所 / 住所変更日 / 法務局支局）を追加 — 2026-05-28
- [x] 物件シートに **`不動産番号` 列** を追加 — 2026-05-28
- [x] 13 件の【テンプレ】Docs に `{{ }}` プレースホルダを書き込み — 2026-05-28
- [x] 権利書なし登記申請書テンプレに `{{権利書がない理由}}` を追加 — 2026-05-28

#### Claude 実装

- [x] `templateService.expandRepeatBlocks_` — `{{#each items}}...{{/each}}` 展開 — 2026-05-28
- [x] `placeholderService` 拡張 — A①/A²/B¹/B² 4 契約書 + 法務局 6 書類分の Context ビルダー — 2026-05-28
- [x] `batchHandler.buildContextForDocument_` — 全 14 書類ディスパッチ — 2026-05-28
- [x] `RepeatableContext` / `PropertyItem` 型追加 — 2026-05-28
- [x] `placeholder-rules.md` § 3 「繰返し」を Phase 3 実装済みに更新 — 2026-05-28
- [x] typecheck 通過 — 2026-05-28
- [ ] 動作確認（ユーザーが書類マスタの「有効」を順次 TRUE にして `npm run build && clasp push` 後に実施）

#### Phase 3 動作確認時のユーザー作業

1. 書類マスタの「有効」列で、確認したい書類だけ TRUE に切り替え（最初は A② 立木付土地売買契約書 など 1 件ずつ推奨）
2. 法務局書類を試す場合は、案件一覧の `売主生年月日` / `売主旧住所` / `売主新住所` / `住所変更日` / `法務局支局` と、物件シートの `不動産番号` に値を入れる
3. B 系統書類を試す場合は、案件一覧の `買主取引先ID` に取引先マスタの ID（例: `PARTNER-001`）を入れる
4. 法務局申請書を試す場合は、案件一覧の `代理人ID` に代理人マスタの ID を入れる

#### Phase 3 で実装しない範囲（Phase 6 以降）

- B 系統契約書の山林/土地金額内訳の自動計算（売買金額をそのまま合計に入れる仮実装）
- 見積書 / 請求書 / 売上計算シート / チェックリスト（Sheets テンプレ前提のため別実装）
- `{{権利書がない理由}}` を案件マスタの列に切り出すか

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
