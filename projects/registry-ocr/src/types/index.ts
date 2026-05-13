// 不動産登記簿 OCR システムの型定義

interface UploadPayload {
  base64: string;
  fileName: string;
  mimeType: string;
}

interface ParsedRegistry {
  location: string;   // 所在
  lotNumber: string;  // 地番
  landType: string;   // 地目
  area: string;       // 地積（㎡）
  ownerName: string;  // 所有者氏名
}

interface ProcessResult {
  success: boolean;
  message: string;
  data?: ParsedRegistry;
}

// テンプレートから継承した汎用型
interface WebAppResponse {
  status: "success" | "error";
  message?: string;
  data?: unknown;
}

interface SheetRow {
  [key: string]: string | number | boolean | Date;
}
