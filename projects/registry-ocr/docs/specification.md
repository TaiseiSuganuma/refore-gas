# registry-ocr 仕様書

不動産登記簿 PDF を Google Apps Script の OCR で読み取り、スプレッドシートへ自動転記するシステム。

- **対象 GAS 種別**: Sheets コンテナバインド型（カスタムメニュー + モーダルダイアログ）
- **エントリースクリプト**: [`src/Code.ts`](../src/Code.ts)
- **タイムゾーン**: `Asia/Tokyo`（[`src/appsscript.json`](../src/appsscript.json)）
- **GAS ランタイム**: V8

## 1. ユーザー操作フロー

```
[スプレッドシートを開く]
        ↓ onOpen()
[メニュー「不動産登記 OCR」が表示される]
        ↓ クリック「PDFを取り込む」
[モーダルダイアログ起動: src/dialog.html / 520x480]
        ↓ PDF を選択 / ドラッグ&ドロップ
[google.script.run.processRegistryPdf(payload) を呼び出し]
        ↓
[OCR → 正規表現パース → シート「抽出結果」へ追記]
        ↓
[ダイアログに成否メッセージを返却]
```

## 2. 入出力仕様

### 2.1 入力ペイロード（`UploadPayload`）

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `base64` | string | ✓ | PDF をブラウザで Base64 化したもの |
| `fileName` | string | ✓ | 元のファイル名（シートにも記録） |
| `mimeType` | string | ✓ | `application/pdf` 固定。それ以外はエラー |

#### バリデーション ([`registryHandler.ts`](../src/handlers/registryHandler.ts) `validatePayload`)

- `base64` が空 → エラー「ファイルデータが空です。」
- `mimeType !== "application/pdf"` → エラー「PDF ファイルのみ対応しています」
- Base64 復号後のサイズが **15MB 超** → エラー「ファイルサイズが大きすぎます（上限 15MB）」

### 2.2 出力（`ProcessResult`）

| フィールド | 型 | 説明 |
|---|---|---|
| `success` | boolean | 処理成否 |
| `message` | string | UI に表示するメッセージ |
| `data` | `ParsedRegistry` | 成功時のみ。パース結果 |

### 2.3 パース結果（`ParsedRegistry`）

| フィールド | 表示名 | 説明 |
|---|---|---|
| `location` | 所在 | 不動産の所在地 |
| `lotNumber` | 地番 | 「○○番」形式 |
| `landType` | 地目 | 山林 / 田 / 畑 / 宅地 / 雑種地 / 原野 / 池沼 / 山岳 / 公衆用道路 / 公園 / 鉄道用地 |
| `area` | 地積（㎡） | 数値のみ（カンマ・全角カンマは除去） |
| `ownerName` | 所有者氏名 | 所有者名 |

抽出失敗時は空文字を返し、UI 側で「（取得できませんでした）」と表示する想定。

## 3. 出力先シート仕様

- シート名: **「抽出結果」**（存在しない場合は自動作成）
- 1行目はヘッダー（太字、初回のみ自動挿入）

| 列 | ヘッダー | 値 |
|---|---|---|
| A | 所在 | `ParsedRegistry.location` |
| B | 地番 | `ParsedRegistry.lotNumber` |
| C | 地目 | `ParsedRegistry.landType` |
| D | 地積（㎡） | `ParsedRegistry.area` |
| E | 所有者氏名 | `ParsedRegistry.ownerName` |
| F | 取込日時 | `yyyy/MM/dd HH:mm:ss` (Asia/Tokyo) |
| G | ファイル名 | `UploadPayload.fileName` |

実装: [`src/services/sheetService.ts`](../src/services/sheetService.ts)

## 4. OCR 処理フロー

実装: [`src/services/ocrService.ts`](../src/services/ocrService.ts) `extractTextFromPdfBase64`

1. Drive 上の一時フォルダ `registry-ocr-tmp` を取得（無ければ作成）
2. Base64 をデコードして PDF Blob を作成し、一時フォルダへ保存
3. **Drive Advanced Service v2** の `Drive.Files.insert` を `ocr: true, ocrLanguage: "ja", convert: true` で呼び、Google Docs へ変換
4. 変換後 Docs を `DocumentApp.openById` で開き、`getBody().getText()` でテキストを取り出す
5. **finally 句で一時 PDF と一時 Docs の両方を `setTrashed(true)` で削除**（成否によらず）

### 注意点

- `@types/google-apps-script` の `Drive` 型は v3 系として宣言されているため、v2 API 呼び出し時は `any` キャストしている（コード中コメント参照）。
- Advanced Service の有効化は `appsscript.json` の `enabledAdvancedServices` で宣言済み。GAS エディタ側でも初回有効化が必要（README 参照）。

## 5. パーサー仕様

実装: [`src/services/registryParser.ts`](../src/services/registryParser.ts)

OCR テキストはレイアウトが登記所・スキャン品質によって揺れるため、各項目について **2 つ以上の正規表現を順に試す** 方式。マッチしなければ空文字。

| 項目 | 主パターン | 補助パターン |
|---|---|---|
| 所在 | `所在\s+([^\n\r①②③]+)` | `所在\n([^\n\r]+)` |
| 地番 | `①地番[^\n]*\n\s*(\S+番\d*)` | `(\d+番\d*)\s+[山田畑宅雑]` |
| 地目 | `\d+番\d*\s+(山林\|田\|畑\|宅地\|雑種地\|原野\|池沼\|山岳\|公衆用道路\|公園\|鉄道用地)` | `②地目[^\n]*\n\s*(\S+)` |
| 地積 | `(\d[\d,，.．]*)\s*:?\s*(?:㎡\|m²)` | `地\s*積\s*㎡?\s*\n\s*([\d,，.．]+)`、`\d+番\d*\s+\S+\s+([\d,，.．]+)` |
| 所有者氏名 | `所有者\s+[^\n]+\n([^\n\r]+)` (住所の次行を氏名) | `所有者\s+(\S+)\s*$` (同一行) |

### 既知の制約

- 地目の選択肢はパーサーで列挙したものに限定（増やす場合は正規表現の編集が必要）。
- 所有者欄は「住所 + 改行 + 氏名」または「同一行に氏名」の 2 パターンしか想定していない。複数所有者の登記簿は最初の 1 件しか取れない。
- 地積はカンマ区切り（半角・全角）を除去するが、単位付き（例: `1,900.50 ㎡`）の小数点は残す。

## 6. 使用 OAuth スコープ

| スコープ | 用途 |
|---|---|
| `spreadsheets` | シートへのヘッダー作成・追記 |
| `drive` | 一時 PDF/Docs の作成・削除、OCR 変換 |
| `documents` | 変換後 Docs からテキスト取得 |
| `script.container.ui` | カスタムメニュー・ダイアログ表示 |

スコープ追加が必要な場合は、共通 [`CLAUDE.md`](../../../CLAUDE.md) のルールに従って事前確認すること。

## 7. エラーハンドリング方針

- [`registryHandler.ts`](../src/handlers/registryHandler.ts) で例外を catch し、`{ success: false, message }` を返却。例外メッセージは UI 側で利用者向け文言として表示される前提なので、利用者に理解できる日本語にすること。
- 一時ファイル削除（`tryDelete`）は失敗してもログに warn を出すのみで処理を継続する。
- OCR 結果が空文字 / 空白のみの場合は明示的にエラー（画像のみで構成された PDF などを検知）。

## 8. ログ

- すべて `Logger_` 名前空間経由（[`src/utils/logger.ts`](../src/utils/logger.ts)）。
- Stackdriver（Cloud Logging）に転送される（`appsscript.json` の `exceptionLogging: "STACKDRIVER"`）。
- 主な記録点: `processUpload start/done/failed`、OCR テキスト先頭 200 文字、パース結果。

## 9. トリガー

- **不要**。手動実行（メニュー → ダイアログ起動）のみ。
- バッチ化する場合は別途トリガーを設定し、`processRegistryPdf` を直接呼ばずに別エントリーポイントを `Code.ts` に追加する設計とする。

## 10. 関連ファイル一覧

| ファイル | 役割 |
|---|---|
| [`src/Code.ts`](../src/Code.ts) | GAS グローバル関数（`onOpen` / `openUploadDialog` / `processRegistryPdf` 等） |
| [`src/dialog.html`](../src/dialog.html) | アップロード用モーダル UI |
| [`src/handlers/registryHandler.ts`](../src/handlers/registryHandler.ts) | 入力検証 → OCR → パース → シート追記のオーケストレーション |
| [`src/services/ocrService.ts`](../src/services/ocrService.ts) | PDF → Docs OCR 変換 + 一時ファイル管理 |
| [`src/services/registryParser.ts`](../src/services/registryParser.ts) | OCR テキストから 5 項目を抽出する正規表現パーサー |
| [`src/services/sheetService.ts`](../src/services/sheetService.ts) | ヘッダー作成・行追記 |
| [`src/types/index.ts`](../src/types/index.ts) | 型定義（`UploadPayload` / `ParsedRegistry` / `ProcessResult`） |
| [`src/utils/logger.ts`](../src/utils/logger.ts) | ロガー |
| [`src/appsscript.json`](../src/appsscript.json) | GAS マニフェスト（スコープ・Advanced Service 宣言） |
