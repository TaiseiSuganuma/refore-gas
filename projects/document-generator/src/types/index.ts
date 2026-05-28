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
  /** 共通PDF出力先親フォルダID (Phase 1 はテストフォルダ `01_Phase1動作確認用`、Phase 2 以降は `案件/YYYY/MM/` を作る親フォルダ) */
  共通PDF出力先親フォルダID: string;
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
// Phase 3: 繰返し対応プレースホルダコンテキスト
// 物件明細など、テンプレ内の {{#each items}}...{{/each}} を展開するための拡張型。
// 根拠:
//   - placeholder-rules.md § 2「繰返し記法（Phase 3 以降）」
//   - documents/customer_contract_land_placeholders.md「別紙詳細（地番リスト） — Phase 3 で繰返し処理」
//   - documents/legal_documents_placeholders.md「不動産の表示（繰返し処理 Phase 3）」
// ============================================================
interface RepeatableContext {
  /** 通常のプレースホルダ（{{key}} → string） */
  [key: string]: string | Array<{ [key: string]: string }> | undefined;
  /**
   * Docs テンプレ内の {{#each items}} 〜 {{/each}} で展開される配列。
   * 各要素は文字列辞書（各キーが繰返しブロック内の {{key}} と対応）。
   * 未指定 or 空配列なら繰返しブロックは削除される。
   */
  items?: Array<{ [key: string]: string }>;
}

// ============================================================
// Phase 3: 物件繰返し用アイテム
// 法務局申請書・お客様契約書の別紙に差し込む 1 物件分の文字列辞書。
// ============================================================
interface PropertyItem {
  /** 物件 No (例: "1") */
  物件No: string;
  /** 所在 (例: "南さつま市加世田内山田") */
  所在: string;
  /** 地番 (例: "10647-1") */
  地番: string;
  /** 地目 (例: "山林") */
  地目: string;
  /** 地積 (例: "7,986" or "7,986㎡") */
  地積: string;
  /** 不動産番号 (登記簿の 12〜13 桁) */
  不動産番号: string;
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

// ============================================================
// Phase 2: 案件一覧シート拡張列（取引先 ID 3 列を AS〜AU に追加）
// 根拠: master-sheet-schema.md § 2「Phase 2 で追加する列」
// ============================================================
interface CaseRowPhase2Extension {
  /** AS列: 売主取引先ID (取引先マスタ参照、A 系統で売主が法人の場合のみ) */
  売主取引先ID?: string;
  /** AT列: 買主取引先ID (取引先マスタ参照、B 系統で買主側) */
  買主取引先ID?: string;
  /** AU列: 代理人ID (代理人マスタ参照、法務局申請書を作る案件) */
  代理人ID?: string;
}

// ============================================================
// Phase 2: 書類マスタシート
// 根拠: master-sheet-schema.md § 5「書類マスタシート」
// シート構造: A=書類名, B=宛先/対象者, C=出力条件, D=原本, E=テンプレート,
//             F=テンプレートURL, G=備考, H=書類ID, I=対応パターン,
//             J=ファイル名テンプレ, K=有効
// ============================================================
interface DocumentMasterRow {
  /** A列: 書類名 (例: 土地売買契約書)。案件一覧の書類列「書類_<書類名>」と紐付け */
  書類名: string;
  /** B列: 宛先/対象者 (例: 売主→リフォレ) */
  "宛先/対象者": string;
  /** C列: 出力条件/利用シーン */
  "出力条件/利用シーン": string;
  /** D列: 原本Docs タイトル */
  原本: string;
  /** E列: テンプレート Docs タイトル */
  テンプレート: string;
  /** F列: テンプレートURL (GAS は URL から fileId をパース) */
  テンプレートURL: string;
  /** G列: 備考 */
  備考: string;
  /** H列: 書類ID (内部識別子、例: purchase_contract_land) */
  書類ID: string;
  /** I列: 対応パターン (カンマ区切り、例: "A③" or "A②,A③,B②") */
  対応パターン: string;
  /** J列: ファイル名テンプレ (例: {{案件ID}}_土地売買契約書_{{今日}}) */
  ファイル名テンプレ: string;
  /** K列: 有効 (true なら出力対象、false なら案件一覧でチェックされても出力しない) */
  有効: boolean;
}

// ============================================================
// Phase 2: 取引先マスタシート
// 根拠: master-sheet-schema.md § 9「取引先マスタシート」
// ============================================================
interface PartnerRow {
  /** A列: 取引先ID (例: PARTNER-001) */
  取引先ID: string;
  /** B列: 区分 (伐採業者 / 買主 / その他法人) */
  区分: string;
  /** C列: 会社名 (例: 株式会社 陽) */
  会社名: string;
  /** D列: 代表者名 (例: 加塩 忠勇) */
  代表者名: string;
  /** E列: 住所 */
  住所: string;
  /** F列: 連絡先 */
  連絡先: string;
  /** G列: 登録番号 (インボイス、例: T6340001015461) */
  登録番号: string;
  /** H列: 銀行名 (取引先側の口座、必要なら) */
  銀行名: string;
  /** I列: 支店名 */
  支店名: string;
  /** J列: 口座種別 */
  口座種別: string;
  /** K列: 口座番号 */
  口座番号: string;
  /** L列: 口座名義 */
  口座名義: string;
  /** M列: 口座名義カナ */
  口座名義カナ: string;
  /** N列: 備考 */
  備考: string;
}

// ============================================================
// Phase 2: 代理人マスタシート
// 根拠: master-sheet-schema.md § 10「代理人マスタシート」
// ============================================================
interface AgentRow {
  /** A列: 代理人ID (例: AGENT-001) */
  代理人ID: string;
  /** B列: 氏名 */
  氏名: string;
  /** C列: 住所 */
  住所: string;
  /** D列: 生年月日 */
  生年月日: Date | string;
  /** E列: 連絡先 */
  連絡先: string;
  /** F列: 関連取引先ID (取引先マスタへの逆引き、任意) */
  関連取引先ID: string;
  /** G列: 備考 */
  備考: string;
}

// ============================================================
// Phase 2: バッチ実行結果（1 案件 × 1 書類ごとの結果）
// 根拠: specification.md § 8「バッチ完了後にダイアログで成功 X 件 / 失敗 Y 件」
// ============================================================
interface BatchEntryResult {
  /** 案件ID */
  caseId: string;
  /** 書類ID (書類マスタの内部識別子) */
  documentId: string;
  /** 書類名 (PDF ファイル名で使用される表示名) */
  documentName: string;
  /** 成功したか */
  success: boolean;
  /** 生成された PDF の URL (成功時) */
  pdfUrl?: string;
  /** スキップ/失敗の理由 */
  message?: string;
}

interface BatchResult {
  /** バッチ ID (タイムスタンプベース、例: 20260528-153012) */
  batchId: string;
  /** 対象案件 ID 一覧 */
  caseIds: string[];
  /** 各書類生成の結果リスト */
  entries: BatchEntryResult[];
  /** 成功件数 */
  successCount: number;
  /** 失敗件数 */
  failureCount: number;
  /** スキップ件数（書類マスタで「有効=false」のもの等） */
  skippedCount: number;
}
