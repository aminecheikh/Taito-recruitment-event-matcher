import { MAX_PDF_PAGES, pdfItemsToText, type PdfTextItem } from "./pdfText";

/**
 * Reads the text of a PDF in the browser with pdf.js. The file never leaves the device;
 * only the text the applicant then chooses to send goes to the AI.
 */
export async function readPdfText(file: File): Promise<string> {
  // Legacy build: the modern one needs very new browser APIs (e.g. Uint8Array.toHex) that older laptops lack.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  try {
    const doc = await task.promise;
    const pageCount = Math.min(doc.numPages, MAX_PDF_PAGES);
    const pages: PdfTextItem[][] = [];
    for (let n = 1; n <= pageCount; n++) {
      const content = await (await doc.getPage(n)).getTextContent();
      pages.push(content.items.flatMap((item) => ("str" in item ? [{ str: item.str, hasEOL: item.hasEOL }] : [])));
    }
    return pdfItemsToText(pages);
  } finally {
    await task.destroy();
  }
}
