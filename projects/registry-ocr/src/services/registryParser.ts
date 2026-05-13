namespace RegistryParser {
  export function parse(text: string): ParsedRegistry {
    return {
      location: extractLocation(text),
      lotNumber: extractLotNumber(text),
      landType: extractLandType(text),
      area: extractArea(text),
      ownerName: extractOwnerName(text),
    };
  }

  // 「所在」行の後に続く地名を取得する
  function extractLocation(text: string): string {
    // "所在" の直後から改行までを取得（ラベルと値が同行の場合 / 次行の場合 両対応）
    const m =
      text.match(/所在\s+([^\n\r①②③]+)/) ||
      text.match(/所在\n([^\n\r]+)/);
    return m ? m[1].trim() : "";
  }

  // 「①地番」欄の後に来る「○○番」を取得する
  function extractLotNumber(text: string): string {
    // ①地番 ②地目 ... の行の次行か、数字+番 のパターン
    const m =
      text.match(/①地番[^\n]*\n\s*(\S+番\d*)/) ||
      text.match(/(\d+番\d*)\s+[山田畑宅雑]/);
    return m ? m[1].trim() : "";
  }

  // 地目（山林・田・畑・宅地・雑種地 etc.）を取得する
  function extractLandType(text: string): string {
    // 地番の右隣に地目が来るパターン
    const m =
      text.match(/\d+番\d*\s+(山林|田|畑|宅地|雑種地|原野|池沼|山岳|公衆用道路|公園|鉄道用地)/) ||
      text.match(/②地目[^\n]*\n\s*(\S+)/);
    return m ? m[1].trim() : "";
  }

  // 地積（数値）を取得する（コロン付き「1900:」にも対応）
  function extractArea(text: string): string {
    const m =
      text.match(/(\d[\d,，.．]*)\s*:?\s*(?:㎡|㎡|m²)/) ||
      text.match(/地\s*積\s*㎡?\s*\n\s*([\d,，.．]+)/);
    if (m) return m[1].replace(/[,，]/g, "").trim();
    // 地番・地目の行に続く数値（例：815番 山林 1900:）
    const m2 = text.match(/\d+番\d*\s+\S+\s+([\d,，.．]+)/);
    return m2 ? m2[1].replace(/[,，]/g, "").trim() : "";
  }

  // 「所有者」行に続く住所の次行を氏名として取得する
  function extractOwnerName(text: string): string {
    // "所有者 住所\n氏名" の2行パターン
    const m = text.match(/所有者\s+[^\n]+\n([^\n\r]+)/);
    if (m) return m[1].trim();
    // "所有者 氏名" が同一行のパターン
    const m2 = text.match(/所有者\s+(\S+)\s*$/m);
    return m2 ? m2[1].trim() : "";
  }
}
