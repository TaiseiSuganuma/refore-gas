// ============================================================
// document-generator 型定義
// Phase 1: 土地売買契約書 MVP
//
// 仕様書根拠:
//   - docs/master-sheet-schema.md § 2 (案件一覧), § 3 (物件), § 4 (設定)
//   - docs/placeholder-rules.md § 1 (値差し込み規約)
//   - docs/documents/purchase_contract_land_placeholders.md (21個のプレースホルダ)
//   - docs/specification.md § 4.1 (入力仕様)
// ============================================================

// GAS の WebApp リクエスト/レスポンス型（既存互換）
interface WebAppRequest {
  parameter: { [key: string]: string };
  parameters: { [key: string]: string[] };
  contentLength: number;
  queryString: string;
  postData?: {
    type: string;
    length: number;
    contents: string;
    name: string;
  };
}

interface WebAppResponse {
  status: "success" | "error";
  message?: string;
  data?: unknown;
}

// 汎用シート行（ヘッダーをキーとした辞書）
interface SheetRow {
  [key: string]: string | number | boolean | Date;
}

// ============================================================
// 案件一覧シート（Phase 1 段階）
// 根拠: master-sheet-schema.md § 2「Phase 1 段階」
// ============================================================
interface CaseRow {
  /** A列: 案件ID (例: EST-20260309-001) */
  案件ID: string;
  /** B列: 見積日 */
  見積日: Date | string;
  /** C列: 宛名 (顧客名) */
  宛名: string;
  /** D列: 敬称 (様/御中など) */
  敬称: string;
  /** E列: 会社名 (個人なら空) */
  会社名: string;
  /** F列: 郵便番号 */
  郵便番号: string;
  /** G列: 住所 */
  住所: string;
  /** H列: TEL */
  TEL: string;
  /** I列: 担当者 */
  担当者: string;
  /** J列: 備考 */
  備考: string;
  /** K列: PDFファイル名 */
  PDFファイル名: string;
  /** L列: 銀行名 */
  銀行名: string;
  /** M列: 支店名 */
  支店名: string;
  /** N列: 種類 (普通/当座) */
  種類: string;
  /** O列: 口座番号 */
  口座番号: string;
  /** P列: 口座名義 */
  口座名義: string;
  /** Q列: 見積金額(円) */
  "見積金額(円)": number | string;
  /** R列: ステータス */
  ステータス: string;
  // Phase 1 で追加する列 (S〜X)
  /** S列: 契約日 */
  契約日: Date | string;
  /** T列: 売主名義人 */
  売主名義人: string;
  /** U列: 売主続柄 */
  売主続柄: string;
  /** V列: 手付金 */
  手付金: number | string;
  /** W列: 口座名義カナ */
  口座名義カナ: string;
  /** X列: 支払予定日 */
  支払予定日: Date | string;
}

// ============================================================
// 物件シート（旧「明細」シート）
// 根拠: master-sheet-schema.md § 3「新しい列構成」
// ============================================================
interface PropertyRow {
  /** A列: 案件ID */
  案件ID: string;
  /** B列: 物件No */
  物件No: number;
  /** C列: 所在 */
  所在: string;
  /** D列: 地番 */
  地番: string;
  /** E列: 地目 */
  地目: string;
  /** F列: 面積(㎡) */
  "面積(㎡)": number | string;
  /** G列: 雑抜き(㎡) */
  "雑抜き(㎡)": number | string;
  /** H列: 樹種 */
  樹種: string;
  /** I列: 樹高(m) */
  "樹高(m)": string;
  /** J列: 金額(円) */
  "金額(円)": number | string;
  /** K列: 備考 */
  備考: string;
}

// ============================================================
// 設定シート
// 根拠: master-sheet-schema.md § 4「設定シート」
// ============================================================
interface SettingsRow {
  /** A列: 項目 (設定キー) */
  項目: string;
  /** B列: 値 */
  値: string;
  /** C列: 説明 */
  説明: string;
}

/** 設定シートから読み込んだキー値マップ */
interface Settings {
  /** 出力先フォルダID (空欄ならマイドライブ直下) */
  出力先フォルダID: string;
  /** テンプレートシート名 (既存見積書ロジック用) */
  テンプレートシート名: string;
  /** 案件一覧シート名 */
  案件一覧シート名: string;
  /** 物件シート名 (Phase 1 で「明細」→「物件」) */
  物件シート名: string;
  /** Phase1テンプレID_土地売買契約書 (プレースホルダ挿入済みコピーの Docs ID) */
  Phase1テンプレID_土地売買契約書: string;
  /** Phase1出力先フォルダID (テストフォルダ `01_Phase1動作確認用` の ID) */
  Phase1出力先フォルダID: string;
  /** その他の設定 (Phase 2 以降で追加予定) */
  [key: string]: string;
}

// ============================================================
// 土地売買契約書 プレースホルダコンテキスト（Phase 1）
// 根拠: docs/documents/purchase_contract_land_placeholders.md「プレースホルダ一覧（サマリー）」
// 21個のプレースホルダに対応。
// 値は GAS 側でフォーマット済みの文字列として渡す（和暦変換・カンマ整形は placeholderService が担当）。
// ============================================================
interface LandPurchaseContractContext {
  /** 契約締結日 (例: 令和8年5月17日) */
  契約日: string;
  /** 名義人（本人と異なる場合）(例: 佐藤てるお) */
  売主名義人: string;
  /** 名義人との続柄（本人なら空文字）(例: 配偶者) */
  売主続柄: string;
  /** 売主住所 (例: 鹿児島県鹿屋市西祓川町509番地5) */
  売主住所: string;
  /** 売主氏名 (例: 佐藤てるお) */
  売主氏名: string;
  /** 売主電話番号 (例: 080-xxxx-xxxx) */
  売主連絡先: string;
  /** 土地の所在 (例: 南さつま市加世田内山田) */
  所在: string;
  /** 地番 (例: 10647-1) */
  地番: string;
  /** 地目 (例: 山林) */
  地目: string;
  /** 筆数 (例: 3) */
  筆数: string;
  /** 地積 (例: 11,326㎡) */
  地積: string;
  /** 土地面積合計 (例: 11,326㎡) */
  土地合計: string;
  /** 売買代金 (例: 500,000) */
  売買金額: string;
  /** 手付金 (例: 50,000) */
  手付金: string;
  /** 振込先銀行名 (例: テスト銀行) */
  銀行名: string;
  /** 振込先支店名 (例: テスト支店) */
  支店名: string;
  /** 口座種別 (例: 普通) */
  口座種類: string;
  /** 口座番号 (例: 1234567) */
  口座番号: string;
  /** 口座名義 (例: 佐藤てるお) */
  口座名義: string;
  /** 口座名義フリガナ (例: サトウテルオ) */
  口座名義カナ: string;
  /** 代金支払予定日 (例: 令和8年6月30日) */
  支払予定日: string;
}

// ============================================================
// 汎用プレースホルダコンテキスト（書類種別を問わない共通型）
// Phase 2 以降で複数書類に対応するための拡張用
// ============================================================
interface PlaceholderContext {
  [key: string]: string;
}

// ============================================================
// 書類生成結果
// 根拠: specification.md § 8「エラーハンドリング方針」
// ============================================================
interface DocumentGenerationResult {
  /** 成功したか */
  success: boolean;
  /** 生成された PDF の Drive ID */
  pdfFileId?: string;
  /** 生成された PDF のURL */
  pdfUrl?: string;
  /** エラーメッセージ (失敗時) */
  errorMessage?: string;
  /** 案件ID */
  caseId: string;
  /** 書類名 */
  documentName: string;
}
