// Web app request/response types for GAS

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

interface SheetRow {
  [key: string]: string | number | boolean | Date;
}
