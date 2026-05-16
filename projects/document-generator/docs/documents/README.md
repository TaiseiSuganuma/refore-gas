# 書類ごとの仕様

このディレクトリには、生成する各書類の個別仕様を 1 ファイル / 1 書類で記述する。

## ファイル命名

`<書類ID>.md`（半角英小文字スネークケース）

## 新規追加時

[`_template.md`](./_template.md) をコピーして埋める。

## 書類一覧

業務フロー（A: 仕入 = 売主→リフォレ、B: 売上 = リフォレ→買主）と
土地・立木の有無で分類。

### A 系統（仕入: 売主 → リフォレ）

| # | 書類ID | 書類名 | 系統 | 仕様書 | 状態 |
|---|---|---|---|---|---|
| 1 | `purchase_contract_land` | 土地売買契約書 | A③ 土地のみ | [`purchase_contract_land.md`](./purchase_contract_land.md) | **Phase 1 MVP** |
| 2 | `purchase_contract_land_tree` | 立木付土地売買契約書 | A② 立木+土地 | TBD | 未作成 |
| 3 | `purchase_contract_tree` | 立木売買契約書 | A① 立木のみ | TBD | 未作成 |

### B 系統（売上: リフォレ → 買主）

| # | 書類ID | 書類名 | 系統 | 仕様書 | 状態 |
|---|---|---|---|---|---|
| 4 | `customer_contract_land` | お客様契約書_土地込 | B② 立木+土地（A③ 含む） | TBD | 未作成 |
| 5 | `customer_contract_tree` | お客様契約書_立木 | B① 立木のみ | TBD | 未作成（要 Docs 化） |

### 見積・請求・社内

| # | 書類ID | 書類名 | 用途 | 仕様書 | 状態 |
|---|---|---|---|---|---|
| 6 | `estimate` | お客様への御見積書 | 契約前、リフォレ→売主 | TBD | 既存実装あり（要刷新） |
| 7 | `invoice` | お客様への請求書 | リフォレ→買主 | TBD | 未作成 |
| 8 | `sales_calc` | 売上計算シート | 社内 | TBD | 未作成 |
| 9 | `checklist` | チェックリスト | 社内 | TBD | 未作成 |

### 法務局関連（土地が絡む場合のみ）

すべて要 Docs 化（現状 Word）。

| # | 書類ID | 書類名 | 仕様書 | 状態 |
|---|---|---|---|---|
| 10 | `legal_transfer_reason` | 法務局所有権移転＿登記原因証明情報 | TBD | 未作成 |
| 11 | `legal_transfer_proxy` | 法務局所有権移転＿委任状 | TBD | 未作成 |
| 12 | `legal_address_proxy` | 法務局登記住所変更＿委任状 | TBD | 未作成 |
| 13 | `legal_transfer_application` | 法務局所有権移転手続き＿登記申請書 | TBD | 未作成 |
| 14 | `legal_address_application` | 法務局登記住所変更＿登記申請書 | TBD | 未作成 |
