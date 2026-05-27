# 書類ごとの仕様

このディレクトリには、生成する各書類の個別仕様（特にプレースホルダ差し込み位置）を 1 ファイル / 1 書類で記述する。

## 出力書類リストの Source of Truth

書類一覧そのものは **[【リフォレ】書類自動生成スプレッドシート](https://docs.google.com/spreadsheets/d/12BEUxTqnADqWsmffGWos0tFe08FohEE-0RQJbLNAnEk/edit?gid=1824029250#gid=1824029250) の「出力書類リスト」シート** に移行済み（2026-05-27）。

シート側に保持されている情報:

| 列 | 内容 |
|---|---|
| 書類名 | 例: 土地売買契約書 |
| 宛先/対象者 | 例: 売主→リフォレ |
| 出力条件/利用シーン | どのタイミングで使うか |
| 原本 | 【原本】Docs のタイトル（**編集禁止** の参照用マスタ） |
| テンプレート | 【テンプレ】Docs のタイトル |
| テンプレートURL | 【テンプレ】Docs の URL（**プレースホルダ差し込み用コピー**） |
| 備考 | 注意事項 |

GAS が書類を引き当てる際は、Phase 2 で新設する「書類マスタ」シート（[`../master-sheet-schema.md` § 5](../master-sheet-schema.md) 参照）に書類 ID・テンプレ ID 等を転記する。出力書類リスト自体は人間が運用する一覧であり、書類マスタが GAS の入力源になる。

## 【原本】と【テンプレ】の使い分け

| | 用途 | 編集可否 |
|---|---|---|
| **【原本】** | 紙運用時代の原本。事前印字されていた権利者・伐採業者・代理人情報が残っているケースあり | **編集禁止**（仕様変更時に立ち返るための保険） |
| **【テンプレ】** | 【原本】からコピーし、可変項目に `{{key}}` プレースホルダを差し込んだ運用版 | GAS がここを毎回コピー → 置換 → PDF 化 |

### 「事前印字されている情報」の扱い

【原本】に印字されている取引先情報は、「ほぼこの会社／代理人」という慣行で固定化されていたもの。
案件によって差し替えるパターンがあるため、**マスタを参照する設計** に切り替える:

| 種別 | 管理場所 | 該当例 |
|---|---|---|
| 伐採業者・買主などの法人 | **取引先マスタ**（新設） | 株式会社 陽 などの常連 |
| 法務局申請書の代理人 | **代理人マスタ**（新設） | （陽さん）など |
| 自社（リフォレ）の乙情報 | **テンプレに固定** | 住所・代表者・TEL 等。担当者交代頻度が低いため動的化しない |
| 売主（個人地主） | **案件マスタに直接** | 売主氏名・住所・連絡先・口座（案件単位で完結） |

詳細は [`../master-sheet-schema.md` § 9〜11](../master-sheet-schema.md) 参照。

## このディレクトリのファイル命名

`<書類ID>.md`（半角英小文字スネークケース） — プレースホルダ差し込み案など、書類ごとの個別仕様を置く。

## 書類 ID と個別仕様の対応

書類リストの最新は **スプレッドシート側** が正。ここは GAS 内部で使う書類 ID とのマッピング目的で残す。

### A 系統（仕入: 売主 → リフォレ）

| # | 書類ID | 書類名 | 系統 | 個別仕様 | 状態 |
|---|---|---|---|---|---|
| 1 | `purchase_contract_land` | 土地売買契約書 | A③ 土地のみ | [`purchase_contract_land_placeholders.md`](./purchase_contract_land_placeholders.md) | **Phase 1 MVP / 挿入済** |
| 2 | `purchase_contract_land_tree` | 立木付土地売買契約書 | A② 立木+土地 | [`purchase_contract_land_tree_placeholders.md`](./purchase_contract_land_tree_placeholders.md) | プレースホルダ案あり / テンプレ未挿入 |
| 3 | `purchase_contract_tree` | 立木売買契約書 | A① 立木のみ | [`purchase_contract_tree_placeholders.md`](./purchase_contract_tree_placeholders.md) | プレースホルダ案あり / テンプレ未挿入 |

### B 系統（売上: リフォレ → 買主）

| # | 書類ID | 書類名 | 系統 | 個別仕様 | 状態 |
|---|---|---|---|---|---|
| 4 | `customer_contract_land` | お客様契約書_土地込 | B② 立木+土地 | [`customer_contract_land_placeholders.md`](./customer_contract_land_placeholders.md) | プレースホルダ案あり / テンプレ未挿入 |
| 5 | `customer_contract_tree` | お客様契約書_立木 | B① 立木のみ | [`customer_contract_tree_placeholders.md`](./customer_contract_tree_placeholders.md) | プレースホルダ案あり / テンプレ未挿入 |

### 見積・請求・社内

| # | 書類ID | 書類名 | 用途 | 個別仕様 | 状態 |
|---|---|---|---|---|---|
| 6 | `estimate` | お客様への御見積書 | 契約前、リフォレ→売主 | TBD | テンプレ Docs 化未着手（現状 xlsx） |
| 7 | `invoice` | お客様への請求書 | リフォレ→買主 | TBD | テンプレ Docs 化未着手（現状 xlsx） |
| 8 | `sales_calc` | 売上計算シート | 社内 | TBD | テンプレ Docs 化未着手 |
| 9 | `checklist` | チェックリスト | 社内 | TBD | テンプレ Docs 化未着手 |

### 法務局関連（土地が絡む場合のみ）

5 書類分まとめて [`legal_documents_placeholders.md`](./legal_documents_placeholders.md) に記載。

| # | 書類ID | 書類名 | 状態 |
|---|---|---|---|
| 10 | `legal_transfer_reason` | 法務局所有権移転＿登記原因証明情報 | プレースホルダ案あり / テンプレ未挿入 |
| 11 | `legal_transfer_proxy` | 法務局所有権移転＿委任状 | プレースホルダ案あり / テンプレ未挿入 |
| 12 | `legal_address_proxy` | 法務局登記住所変更＿委任状 | プレースホルダ案あり / テンプレ未挿入 |
| 13a | `legal_transfer_application_with_rightdoc` | 法務局所有権移転手続き＿登記申請書（権利書あり） | プレースホルダ案あり / テンプレ未挿入 |
| 13b | `legal_transfer_application_without_rightdoc` | 法務局所有権移転手続き＿登記申請書（権利書なし） | プレースホルダ案あり / テンプレ未挿入 |
| 14 | `legal_address_application` | 法務局登記住所変更＿登記申請書 | プレースホルダ案あり / テンプレ未挿入 |

> 法務局「登記申請書（所有権移転）」は権利書あり/なしの 2 バリエーション。書類マスタでは別 ID として保持する。
