namespace OcrService {
  const TEMP_FOLDER_NAME = "registry-ocr-tmp";

  // Base64 PDF を Drive に保存 → Docs に OCR 変換 → テキスト抽出 → 一時ファイル削除
  export function extractTextFromPdfBase64(base64: string, fileName: string): string {
    const folder = getOrCreateTempFolder();
    const pdfFile = savePdfToDrive(base64, fileName, folder);
    Logger_.info("PDF saved", { fileId: pdfFile.getId() });

    let docFile: GoogleAppsScript.Drive.File | null = null;
    try {
      docFile = convertPdfToDoc(pdfFile, folder);
      Logger_.info("OCR conversion done", { docId: docFile.getId() });
      const text = readDocText(docFile);
      Logger_.info("extracted text length", { len: text.length });
      return text;
    } finally {
      // 成否に関わらず一時ファイルを削除する
      tryDelete(pdfFile);
      if (docFile) tryDelete(docFile);
    }
  }

  function getOrCreateTempFolder(): GoogleAppsScript.Drive.Folder {
    const iter = DriveApp.getFoldersByName(TEMP_FOLDER_NAME);
    return iter.hasNext() ? iter.next() : DriveApp.createFolder(TEMP_FOLDER_NAME);
  }

  function savePdfToDrive(
    base64: string,
    fileName: string,
    folder: GoogleAppsScript.Drive.Folder
  ): GoogleAppsScript.Drive.File {
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64),
      "application/pdf",
      fileName
    );
    return folder.createFile(blob);
  }

  // Drive Advanced Service (v2) を使って PDF → Google Docs に OCR 変換
  // @types/google-apps-script は Drive を v3 型として宣言しているが、
  // GAS の Advanced Drive Service を有効化すると実行時は v2 として動作するため any でキャストする。
  function convertPdfToDoc(
    pdfFile: GoogleAppsScript.Drive.File,
    folder: GoogleAppsScript.Drive.Folder
  ): GoogleAppsScript.Drive.File {
    const resource = {
      title: `ocr_${pdfFile.getName()}`,
      parents: [{ id: folder.getId() }],
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const driveV2 = Drive as any;
    const insertedFile = driveV2.Files.insert(resource, pdfFile.getBlob(), {
      ocr: true,
      ocrLanguage: "ja",
      convert: true,
    }) as { id?: string };
    const docId = insertedFile.id;
    if (!docId) throw new Error("OCR 変換に失敗しました: ファイルIDが取得できません");
    return DriveApp.getFileById(docId);
  }

  function readDocText(docFile: GoogleAppsScript.Drive.File): string {
    const doc = DocumentApp.openById(docFile.getId());
    return doc.getBody().getText();
  }

  function tryDelete(file: GoogleAppsScript.Drive.File): void {
    try {
      DriveApp.getFileById(file.getId()).setTrashed(true);
    } catch (e) {
      Logger_.warn("一時ファイルの削除に失敗", e);
    }
  }
}
