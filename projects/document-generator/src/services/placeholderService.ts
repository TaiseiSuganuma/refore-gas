// ============================================================
// placeholderService.ts — プレースホルダ値生成サービス
// Phase 1: 土地売買契約書 MVP
//
// 仕様書根拠:
//   - docs/placeholder-rules.md § 1「値差し込み（Phase 1 で実装）」
//     記法: {{key}} / {{key:date_jp}} / {{key:date}} / {{key:yen}}
//   - docs/documents/purchase_contract_land_placeholders.md「プレースホルダ一覧（サマリー）」
//     21 個のプレースホルダとデータ源の対応
//   - docs/master-sheet-schema.md § 2「Phase 1 段階」
//     案件一覧シートの列構成 (A〜X)
//   - docs/master-sheet-schema.md § 3「物件シート」
//     物件行からの地積・筆数集計
//   - docs/specification.md § 8「エラーハンドリング方針」
//     「テンプレのプレースホルダがマスタに無い → 警告ログ + 処理継続（未差込のまま PDF 出力）」
// ============================================================

namespace PlaceholderService {
  // ----------------------------------------------------------
  // 和暦変換テーブル
  // 根拠: placeholder-rules.md § 1「{{key:date_jp}} → 令和8年5月17日」
  // ----------------------------------------------------------

  /**
   * 元号の定義。開始年月日（JST 基準）を Date として保持。
   * 現状は令和のみ実装（Phase 1 で必要な範囲）。
   */
  const ERA_TABLE: Array<{ name: string; startYear: number; startMonth: number; startDay: number }> = [
    // 令和: 2019年5月1日〜
    { name: "令和", startYear: 2019, startMonth: 5, startDay: 1 },
    // 平成: 1989年1月8日〜2019年4月30日
    { name: "平成", startYear: 1989, startMonth: 1, startDay: 8 },
    // 昭和: 1926年12月25日〜1989年1月7日
    { name: "昭和", startYear: 1926, startMonth: 12, startDay: 25 },
  ];

  // ----------------------------------------------------------
  // パブリック API
  // ----------------------------------------------------------

  /**
   * 案件行・物件行から土地売買契約書用プレースホルダコンテキストを生成する。
   *
   * 根拠: purchase_contract_land_placeholders.md「プレースホルダ一覧（サマリー）」
   * 21 個のプレースホルダに対応。
   *
   * @param caseRow       案件一覧シートの 1 行（CaseRow）
   * @param propertyRows  物件シートの案件 ID に紐づく行（PropertyRow[]）
   * @returns プレースホルダキー → フォーマット済み文字列のマップ
   */
  export function buildLandPurchaseContractContext(
    caseRow: CaseRow,
    propertyRows: PropertyRow[]
  ): LandPurchaseContractContext {
    // ① 契約日 → 和暦変換
    // 根拠: purchase_contract_land_placeholders.md「差込例: 令和8年5月17日」
    const 契約日Str = toJapaneseEra_(caseRow.契約日);

    // ② 支払予定日 → 和暦変換
    // 根拠: purchase_contract_land_placeholders.md「差込例: 令和8年6月30日」
    const 支払予定日Str = toJapaneseEra_(caseRow.支払予定日);

    // ③ 物件シートから筆数・地積・土地合計を集計
    // 根拠: purchase_contract_land_placeholders.md
    //   「{{筆数}}: 3」「{{地積}}: 11,326㎡」「{{土地合計}}: 11,326㎡」
    //   「土地合計: 明細から集計」
    // Phase 1 では物件シートの 1 案件に紐づく全行を集計する。
    // 物件が 0 件の場合は空文字。
    const 筆数 = propertyRows.length > 0 ? String(propertyRows.length) : "";
    const totalArea = propertyRows.reduce((sum, row) => {
      const area = parseNumber_(row["面積(㎡)"]);
      return sum + area;
    }, 0);
    const 地積Str = propertyRows.length > 0 ? formatNumberWithCommas_(totalArea) + "㎡" : "";
    const 土地合計Str = 地積Str; // Phase 1 では地積 = 土地合計（繰返しなし）

    // ④ 売主名義人: 空の場合は宛名（C列）をフォールバックとする
    // 根拠: purchase_contract_land_placeholders.md
    //   「{{売主名義人}}: 名義人（本人と異なる場合）」
    //   「{{売主氏名}}: 案件一覧「宛名」列」
    const 売主名義人Str = String(caseRow.売主名義人 ?? "").trim() || String(caseRow.宛名 ?? "").trim();

    // ⑤ 売主氏名: 案件一覧「宛名」列
    const 売主氏名Str = String(caseRow.宛名 ?? "").trim();

    // ⑥ 売買金額: カンマ整形
    // 根拠: purchase_contract_land_placeholders.md「差込例: 500,000」
    const 売買金額Str = formatNumberWithCommas_(parseNumber_(caseRow["見積金額(円)"]));

    // ⑦ 手付金: カンマ整形
    // 根拠: purchase_contract_land_placeholders.md「差込例: 50,000」
    const 手付金Str = formatNumberWithCommas_(parseNumber_(caseRow.手付金));

    // ⑧ 物件シートの最初の行から所在・地番・地目を取得（Phase 1: 1物件想定）
    // 根拠: purchase_contract_land_placeholders.md
    //   「{{所在}}: 物件シート」「{{地番}}: 物件シート」「{{地目}}: 物件シート」
    // Phase 1 では物件シートの先頭行を使用。複数物件の場合は警告ログを出す。
    const firstProp = propertyRows[0] ?? null;
    if (propertyRows.length > 1) {
      Logger_.warn(
        `[PlaceholderService] 物件行が複数あります（${propertyRows.length} 件）。` +
          "Phase 1 では先頭行のみ使用します。複数物件の繰返し差し込みは Phase 3 で対応予定です。"
      );
    }
    const 所在Str = firstProp ? String(firstProp.所在 ?? "").trim() : "";
    const 地番Str = firstProp ? String(firstProp.地番 ?? "").trim() : "";
    const 地目Str = firstProp ? String(firstProp.地目 ?? "").trim() : "";

    const context: LandPurchaseContractContext = {
      契約日: 契約日Str,
      売主名義人: 売主名義人Str,
      売主続柄: String(caseRow.売主続柄 ?? "").trim(),
      売主住所: String(caseRow.住所 ?? "").trim(),
      売主氏名: 売主氏名Str,
      売主連絡先: String(caseRow.TEL ?? "").trim(),
      所在: 所在Str,
      地番: 地番Str,
      地目: 地目Str,
      筆数: 筆数,
      地積: 地積Str,
      土地合計: 土地合計Str,
      売買金額: 売買金額Str,
      手付金: 手付金Str,
      銀行名: String(caseRow.銀行名 ?? "").trim(),
      支店名: String(caseRow.支店名 ?? "").trim(),
      口座種類: String(caseRow.種類 ?? "").trim(),
      口座番号: String(caseRow.口座番号 ?? "").trim(),
      口座名義: String(caseRow.口座名義 ?? "").trim(),
      口座名義カナ: String(caseRow.口座名義カナ ?? "").trim(),
      支払予定日: 支払予定日Str,
    };

    // 空値の警告ログ（仕様書 § 8 方針: 警告 + 継続）
    warnEmptyValues_(context);

    return context;
  }

  /**
   * フォーマット指定子付きプレースホルダ（{{key:format}}）を解決する。
   *
   * Phase 1 では通常の {{key}} 置換のみを使用するが、
   * テンプレに {{key:date_jp}} 等が含まれる場合に備えて実装しておく。
   *
   * 根拠: placeholder-rules.md § 1「値の整形（フォーマット指定）」
   *
   * @param rawValue   生の値（文字列または日付）
   * @param format     フォーマット指定子 ("date_jp" | "date" | "yen" | undefined)
   * @returns          フォーマット済み文字列
   */
  export function applyFormat_(rawValue: string | Date | number, format?: string): string {
    if (!format) {
      return String(rawValue ?? "");
    }
    switch (format) {
      case "date_jp":
        return toJapaneseEra_(rawValue);
      case "date":
        return toDateString_(rawValue);
      case "yen":
        return formatNumberWithCommas_(parseNumber_(rawValue));
      default:
        Logger_.warn(`[PlaceholderService] 未知のフォーマット指定子: "${format}"`);
        return String(rawValue ?? "");
    }
  }

  // ----------------------------------------------------------
  // プライベートヘルパー
  // ----------------------------------------------------------

  /**
   * 日付値を和暦文字列に変換する。
   *
   * 根拠: placeholder-rules.md § 1「{{key:date_jp}} → 令和8年5月17日」
   *
   * 入力:
   *   - Date オブジェクト
   *   - "2026-05-17" / "2026/05/17" 形式の文字列
   *   - スプレッドシートのセル値（Date インスタンス）
   *
   * 変換ルール: ERA_TABLE を降順（新しい順）に走査し、最初にマッチした元号を使用。
   *
   * @param value  日付値（Date | string | number）
   * @returns      "令和8年5月17日" 形式の文字列。変換不能な場合は空文字。
   */
  function toJapaneseEra_(value: Date | string | number | null | undefined): string {
    if (value === null || value === undefined || value === "") return "";

    const date = toDate_(value);
    if (!date || isNaN(date.getTime())) {
      Logger_.warn(`[PlaceholderService] 和暦変換: 日付として解釈できない値 "${value}"`);
      return String(value);
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 0始まりを補正
    const day = date.getDate();

    // ERA_TABLE は新しい元号が先頭にある（降順）
    for (const era of ERA_TABLE) {
      const eraStart = new Date(era.startYear, era.startMonth - 1, era.startDay);
      if (date >= eraStart) {
        const eraYear = year - era.startYear + 1;
        const eraYearStr = eraYear === 1 ? "元" : String(eraYear);
        return `${era.name}${eraYearStr}年${month}月${day}日`;
      }
    }

    // どの元号にもマッチしない場合（1926年以前）は西暦で返す
    Logger_.warn(
      `[PlaceholderService] 和暦変換: ERA_TABLE に対応する元号がありません (${year}/${month}/${day})。西暦で返します。`
    );
    return `${year}年${month}月${day}日`;
  }

  /**
   * 日付値を「YYYY年M月D日」形式の西暦文字列に変換する。
   *
   * 根拠: placeholder-rules.md § 1「{{key:date}} → 2026年5月17日」
   *
   * @param value  日付値
   * @returns      "2026年5月17日" 形式の文字列
   */
  function toDateString_(value: Date | string | number | null | undefined): string {
    if (value === null || value === undefined || value === "") return "";

    const date = toDate_(value);
    if (!date || isNaN(date.getTime())) {
      Logger_.warn(`[PlaceholderService] 西暦変換: 日付として解釈できない値 "${value}"`);
      return String(value);
    }

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  }

  /**
   * 任意の日付表現を Date オブジェクトに変換する。
   *
   * GAS スプレッドシートのセル値は Date オブジェクトになっている場合と
   * 文字列になっている場合がある（getValues() の挙動依存）。
   *
   * @param value  変換対象
   * @returns      Date オブジェクト、または null（変換不能の場合）
   */
  function toDate_(value: Date | string | number | null | undefined): Date | null {
    if (value === null || value === undefined || value === "") return null;

    if (value instanceof Date) {
      return value;
    }

    // 数値はシリアル値として扱わない（GAS では getValues() で Date が返るため不要）
    // 文字列の場合: "2026-05-17" or "2026/05/17" or "2026年5月17日" など
    const str = String(value).trim();
    if (!str) return null;

    // "YYYY-MM-DD" または "YYYY/MM/DD" 形式
    const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
      const y = parseInt(isoMatch[1], 10);
      const m = parseInt(isoMatch[2], 10) - 1;
      const d = parseInt(isoMatch[3], 10);
      return new Date(y, m, d);
    }

    // JavaScript の Date.parse() にフォールバック
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    return null;
  }

  /**
   * 数値またはその文字列表現をカンマ区切りの文字列にフォーマットする。
   *
   * 根拠: placeholder-rules.md § 1「{{key:yen}} → ¥1,200,000」
   * ただし土地売買契約書では "¥" プレフィックスなし（差込例: "500,000"）
   *
   * @param value  数値または数値文字列（カンマ・¥記号を除去して解釈）
   * @returns      カンマ区切りの文字列（例: "1,200,000"）。0 の場合は "0"。
   */
  function formatNumberWithCommas_(value: number): string {
    if (isNaN(value)) return "";
    return value.toLocaleString("ja-JP");
  }

  /**
   * 数値・文字列・その他から数値に変換する。
   *
   * カンマ・¥記号・円記号・全角数字は除去して解釈する。
   *
   * @param value  変換対象
   * @returns      数値（変換不能の場合は 0）
   */
  function parseNumber_(value: string | number | boolean | Date | null | undefined): number {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return isNaN(value) ? 0 : value;
    if (typeof value === "boolean") return value ? 1 : 0;
    if (value instanceof Date) return 0;

    // 文字列のクリーニング: カンマ・通貨記号・全角数字・スペースを除去
    const cleaned = String(value)
      .replace(/[,，、¥￥円\s]/g, "")
      .replace(/[０-９]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30));

    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }

  /**
   * LandPurchaseContractContext の各値が空文字の場合に警告ログを出す。
   *
   * 根拠: specification.md § 8「マスタに必須値が無い → 該当案件のみスキップ + ログに警告」
   * Phase 1 では処理は継続する（スキップは documentHandler 層の責務）。
   *
   * @param context  検証対象のコンテキスト
   */
  function warnEmptyValues_(context: LandPurchaseContractContext): void {
    const REQUIRED_KEYS: Array<keyof LandPurchaseContractContext> = [
      "契約日",
      "売主氏名",
      "売主住所",
      "所在",
      "地番",
      "地目",
      "筆数",
      "地積",
      "売買金額",
      "手付金",
      "支払予定日",
    ];

    for (const key of REQUIRED_KEYS) {
      if (!context[key]) {
        Logger_.warn(
          `[PlaceholderService] 必須プレースホルダ "{{${key}}}" の値が空です。PDF に未差し込みで出力されます。`
        );
      }
    }
  }

  // ============================================================
  // Phase 3: 各書類別 Context ビルダー
  // ============================================================

  /**
   * 物件行から PropertyItem 配列を組み立てる（繰返し展開用）。
   * 根拠: documents/legal_documents_placeholders.md「不動産の表示（繰返し処理 Phase 3）」
   */
  export function buildPropertyItems(
    propertyRows: PropertyRow[]
  ): PropertyItem[] {
    return propertyRows.map((row) => {
      const sr = row as unknown as SheetRow;
      const noRaw =
        sr["物件No"] ?? sr["土地No"] ?? "";
      const areaNum = parseNumber_(sr["面積(㎡)"]);
      const 地積Str = areaNum > 0 ? formatNumberWithCommas_(areaNum) : "";
      return {
        物件No: String(noRaw ?? "").trim(),
        所在: String(sr["所在"] ?? "").trim(),
        地番: String(sr["地番"] ?? "").trim(),
        地目: String(sr["地目"] ?? "").trim(),
        地積: 地積Str,
        不動産番号: String(sr["不動産番号"] ?? "").trim(),
      };
    });
  }

  /**
   * 物件行から「全筆まとめ表示」を組み立てる（例: 南さつま市加世田内山田10647-1, 10510-1, 10510-2）。
   * 根拠: documents/legal_documents_placeholders.md「{{不動産表示_全筆}}」
   */
  export function buildAllPropertyDisplay(
    propertyRows: PropertyRow[]
  ): string {
    if (propertyRows.length === 0) return "";
    const seenAddresses: { [key: string]: boolean } = {};
    const parts: string[] = [];
    for (const row of propertyRows) {
      const sr = row as unknown as SheetRow;
      const 所在 = String(sr["所在"] ?? "").trim();
      const 地番 = String(sr["地番"] ?? "").trim();
      if (!所在 || !地番) continue;
      const key = `${所在}${地番}`;
      if (seenAddresses[key]) continue;
      seenAddresses[key] = true;
      parts.push(key);
    }
    return parts.join(", ");
  }

  // ----------------------------------------------------------
  // A② 立木付土地売買契約書
  // 根拠: documents/purchase_contract_land_tree_placeholders.md
  //   土地売買契約書（A③）から「売買金額」→「売買金額合計/土地代金/立木代金」に分岐
  //   物件シートから 立木代金 = 全物件「金額(円)」の合計（税抜）として算出
  //   土地代金 = 案件マスタ「売買金額」（A② では土地代金として運用）
  //   売買金額合計 = 土地代金 + round(立木代金 * 1.1)
  // ----------------------------------------------------------
  export function buildLandTreeContractContext(
    caseRow: CaseRow,
    propertyRows: PropertyRow[]
  ): PlaceholderContext {
    const base = buildLandPurchaseContractContext(caseRow, propertyRows);

    // 立木代金 = 物件シートの「金額(円)」合計（A② では物件シート＝立木明細の前提）
    const 立木代金Num = propertyRows.reduce(
      (sum, row) => sum + parseNumber_((row as unknown as SheetRow)["金額(円)"]),
      0
    );
    const 土地代金Num = parseNumber_(caseRow["見積金額(円)"]);
    const 売買金額合計Num = 土地代金Num + Math.round(立木代金Num * 1.1);

    return {
      ...base,
      売買金額: "", // A② テンプレでは未使用（合計に統合）
      売買金額合計: formatNumberWithCommas_(売買金額合計Num),
      土地代金: formatNumberWithCommas_(土地代金Num),
      立木代金: formatNumberWithCommas_(立木代金Num),
    };
  }

  // ----------------------------------------------------------
  // A① 立木売買契約書
  // 根拠: documents/purchase_contract_tree_placeholders.md
  //   土地売買契約書（A③）と同形式。{{売買金額}} は「消費税込」表記
  //   物件シートの「金額(円)」合計（×1.1）を消費税込として入れる
  // ----------------------------------------------------------
  export function buildTreeContractContext(
    caseRow: CaseRow,
    propertyRows: PropertyRow[]
  ): PlaceholderContext {
    const base = buildLandPurchaseContractContext(caseRow, propertyRows);

    // A① の {{売買金額}} は税込。物件合計金額（税抜）×1.1 を採用
    const 物件合計税抜 = propertyRows.reduce(
      (sum, row) => sum + parseNumber_((row as unknown as SheetRow)["金額(円)"]),
      0
    );
    // 案件マスタの「売買金額」(税込) が入っていればそちらを優先
    const 案件売買金額Num = parseNumber_(caseRow["見積金額(円)"]);
    const 売買金額Num =
      案件売買金額Num > 0
        ? 案件売買金額Num
        : Math.round(物件合計税抜 * 1.1);

    return {
      ...base,
      売買金額: formatNumberWithCommas_(売買金額Num),
    };
  }

  // ----------------------------------------------------------
  // B② お客様契約書_土地込
  // 根拠: documents/customer_contract_land_placeholders.md
  //   売主 = リフォレ（固定）、買主 = 取引先マスタ参照
  //   物件シートからの集計（代表所在・代表面積・合計面積など）
  //   B 系統では物件シートに依存しない金額内訳が必要（ユーザー判断: 売買金額をそのまま合計に）
  // ----------------------------------------------------------
  export function buildCustomerLandContractContext(
    caseRow: CaseRow,
    propertyRows: PropertyRow[],
    buyer: PartnerRow | null
  ): PlaceholderContext {
    // 物件サマリ
    const firstProp = propertyRows[0];
    const sr0 = firstProp ? (firstProp as unknown as SheetRow) : null;
    const 代表所在 = sr0
      ? `${String(sr0["所在"] ?? "").trim()}${String(sr0["地番"] ?? "").trim()}`
      : "";
    const 代表面積Num = sr0 ? parseNumber_(sr0["面積(㎡)"]) : 0;

    const 筆数Num = propertyRows.length;
    const 他筆数 = 筆数Num > 0 ? Math.max(0, 筆数Num - 1) : 0;
    const 合計面積Num = propertyRows.reduce(
      (sum, row) => sum + parseNumber_((row as unknown as SheetRow)["面積(㎡)"]),
      0
    );
    const 合計雑抜きNum = propertyRows.reduce(
      (sum, row) => sum + parseNumber_((row as unknown as SheetRow)["雑抜き(㎡)"]),
      0
    );

    // 金額: B 系統では物件シート以外と案件マスタだけで組み立てる方針
    //   売買金額合計 = 案件マスタ「売買金額」（税込）
    //   山林金額/土地金額の内訳は Phase 3 では空のまま（人間が手で調整）
    const 売買金額合計Num = parseNumber_(caseRow["見積金額(円)"]);

    const ctx: PlaceholderContext = {
      ...buildCommonDateContext_(caseRow),

      代表所在,
      代表面積: 代表面積Num > 0 ? formatNumberWithCommas_(代表面積Num) : "",
      他筆数: String(他筆数),
      筆数: String(筆数Num),
      合計面積: 合計面積Num > 0 ? formatNumberWithCommas_(合計面積Num) : "",
      合計雑抜き: 合計雑抜きNum > 0 ? formatNumberWithCommas_(合計雑抜きNum) : "",
      売買金額合計: formatNumberWithCommas_(売買金額合計Num),
      消費税合計: "",
      山林金額: "",
      山林消費税: "",
      土地金額: "",

      買主会社名: buyer ? buyer.会社名 : "",
      買主代表者名: buyer ? buyer.代表者名 : "",
      買主住所: buyer ? buyer.住所 : "",
      買主登録番号: buyer ? buyer.登録番号 : "",
    };

    // 別紙繰返し用（地番リスト）
    (ctx as unknown as RepeatableContext).items = buildPropertyItems(
      propertyRows
    ).map((p) => ({
      物件No: p.物件No,
      所在: p.所在,
      地番: p.地番,
    }));

    return ctx;
  }

  // ----------------------------------------------------------
  // B① お客様契約書_立木
  // 根拠: documents/customer_contract_tree_placeholders.md
  //   B② と同じプレースホルダセット（テンプレ名「土地別」だがレイアウトは同じ）
  // ----------------------------------------------------------
  export function buildCustomerTreeContractContext(
    caseRow: CaseRow,
    propertyRows: PropertyRow[],
    buyer: PartnerRow | null
  ): PlaceholderContext {
    return buildCustomerLandContractContext(caseRow, propertyRows, buyer);
  }

  // ----------------------------------------------------------
  // 法務局書類共通の Context 構築
  // 根拠: documents/legal_documents_placeholders.md「プレースホルダ一覧（サマリー）」
  // ----------------------------------------------------------

  /**
   * 法務局書類で共通の Context を組み立てる。
   * 売主・買主・代理人・契約日・書類作成日・法務局支局・不動産表示など。
   */
  function buildLegalCommonContext_(
    caseRow: CaseRow,
    propertyRows: PropertyRow[],
    buyer: PartnerRow | null,
    agent: AgentRow | null
  ): PlaceholderContext {
    const sr = caseRow as unknown as SheetRow;
    const 契約日_和暦 = toJapaneseEra_(caseRow.契約日);
    const 書類作成日_和暦 = toJapaneseEra_(new Date());
    const 住所変更日Raw = sr["住所変更日"];
    const 住所変更日_和暦 =
      住所変更日Raw instanceof Date || typeof 住所変更日Raw === "string"
        ? toJapaneseEra_(住所変更日Raw)
        : "";

    return {
      契約日_和暦,
      書類作成日_和暦,
      住所変更日_和暦,
      売主氏名: String(caseRow.宛名 ?? "").trim(),
      売主住所: String(caseRow.住所 ?? "").trim(),
      売主連絡先: String(caseRow.TEL ?? "").trim(),
      売主生年月日: String(sr["売主生年月日"] ?? "").trim(),
      売主旧住所: String(sr["売主旧住所"] ?? "").trim(),
      売主新住所: String(sr["売主新住所"] ?? "").trim(),
      委任者住所: String(sr["売主旧住所"] ?? caseRow.住所 ?? "").trim(),
      委任者氏名: String(caseRow.宛名 ?? "").trim(),
      買主会社名: buyer ? buyer.会社名 : "",
      買主住所: buyer ? buyer.住所 : "",
      代理人氏名: agent ? agent.氏名 : "",
      代理人住所: agent ? agent.住所 : "",
      法務局支局: String(sr["法務局支局"] ?? "").trim(),
      不動産表示_全筆: buildAllPropertyDisplay(propertyRows),
    };
  }

  // ----------------------------------------------------------
  // 法務局: 登記原因証明情報
  // 根拠: documents/legal_documents_placeholders.md § 1
  // ----------------------------------------------------------
  export function buildLegalTransferReasonContext(
    caseRow: CaseRow,
    propertyRows: PropertyRow[],
    buyer: PartnerRow | null,
    agent: AgentRow | null
  ): PlaceholderContext {
    return buildLegalCommonContext_(caseRow, propertyRows, buyer, agent);
  }

  // ----------------------------------------------------------
  // 法務局: 所有権移転委任状
  // 根拠: documents/legal_documents_placeholders.md § 2
  // ----------------------------------------------------------
  export function buildLegalTransferProxyContext(
    caseRow: CaseRow,
    propertyRows: PropertyRow[],
    buyer: PartnerRow | null,
    agent: AgentRow | null
  ): PlaceholderContext {
    return buildLegalCommonContext_(caseRow, propertyRows, buyer, agent);
  }

  // ----------------------------------------------------------
  // 法務局: 登記住所変更委任状
  // 根拠: documents/legal_documents_placeholders.md § 3
  // ----------------------------------------------------------
  export function buildLegalAddressProxyContext(
    caseRow: CaseRow,
    propertyRows: PropertyRow[],
    buyer: PartnerRow | null,
    agent: AgentRow | null
  ): PlaceholderContext {
    return buildLegalCommonContext_(caseRow, propertyRows, buyer, agent);
  }

  // ----------------------------------------------------------
  // 法務局: 登記申請書 (権利書あり / 権利書なし)
  // 根拠: documents/legal_documents_placeholders.md § 4
  //   不動産表示は繰返し（物件シートから items 配列で渡す）
  //   課税価格 = 土地代金（案件マスタ「売買金額」）
  //   登録免許税 = 課税価格 × 0.02（ユーザー判断: 土地代金 × 2%）
  //   権利書なしは {{権利書がない理由}} を追加
  // ----------------------------------------------------------
  export function buildLegalTransferApplicationContext(
    caseRow: CaseRow,
    propertyRows: PropertyRow[],
    buyer: PartnerRow | null,
    agent: AgentRow | null,
    options: { withoutRightDoc?: boolean; reason?: string } = {}
  ): PlaceholderContext {
    const base = buildLegalCommonContext_(caseRow, propertyRows, buyer, agent);
    const 課税価格Num = parseNumber_(caseRow["見積金額(円)"]);
    const 登録免許税Num = Math.floor(課税価格Num * 0.02);

    const ctx: PlaceholderContext = {
      ...base,
      課税価格: formatNumberWithCommas_(課税価格Num),
      登録免許税: formatNumberWithCommas_(登録免許税Num),
    };

    // 物件繰返し
    (ctx as unknown as RepeatableContext).items = buildPropertyItems(
      propertyRows
    ) as unknown as Array<{ [key: string]: string }>;

    // 権利書なしの場合のみ「権利書がない理由」を入れる
    if (options.withoutRightDoc) {
      ctx["権利書がない理由"] = options.reason ?? "";
    }

    return ctx;
  }

  // ----------------------------------------------------------
  // 法務局: 登記住所変更登記申請書
  // 根拠: documents/legal_documents_placeholders.md § 5
  //   登録免許税_住所変更 = 不動産 1 筆につき 1,000 円
  // ----------------------------------------------------------
  export function buildLegalAddressApplicationContext(
    caseRow: CaseRow,
    propertyRows: PropertyRow[],
    buyer: PartnerRow | null,
    agent: AgentRow | null
  ): PlaceholderContext {
    const base = buildLegalCommonContext_(caseRow, propertyRows, buyer, agent);
    const 筆数 = propertyRows.length;
    const 登録免許税_住所変更Num = 筆数 * 1000;

    const ctx: PlaceholderContext = {
      ...base,
      登録免許税_住所変更: formatNumberWithCommas_(登録免許税_住所変更Num),
    };

    (ctx as unknown as RepeatableContext).items = buildPropertyItems(
      propertyRows
    ) as unknown as Array<{ [key: string]: string }>;

    return ctx;
  }

  // ----------------------------------------------------------
  // 共通日付 Context（B 系統契約書用）
  // ----------------------------------------------------------
  function buildCommonDateContext_(caseRow: CaseRow): PlaceholderContext {
    return {
      契約日: toJapaneseEra_(caseRow.契約日),
    };
  }
}
