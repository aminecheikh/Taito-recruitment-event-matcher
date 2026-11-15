/** Pure helpers for turning a CV PDF into plain text in the browser. Nothing here touches the network. */

export const MAX_PDF_BYTES = 5 * 1024 * 1024;
export const MAX_PDF_PAGES = 10;

export type PdfTextItem = { str: string; hasEOL?: boolean };

/** Joins pdf.js text items into lines, one blank line between pages; tidies spaces and blank lines. */
export function pdfItemsToText(pages: readonly (readonly PdfTextItem[])[]): string {
  return pages
    .map((items) => items.map((item) => item.str + (item.hasEOL ? "\n" : "")).join(""))
    .join("\n\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Returns a message when the file can't be used, or null when it can. */
export function checkPdfFile(file: { type: string; name: string; size: number }): string | null {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Choose a PDF file, or paste your text instead.";
  if (file.size > MAX_PDF_BYTES) return "That PDF is larger than 5 MB. Paste the text instead.";
  return null;
}
