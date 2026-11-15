import { describe, expect, test } from "vitest";
import { checkPdfFile, MAX_PDF_BYTES, pdfItemsToText } from "./pdfText";

describe("pdfItemsToText", () => {
  test("pdfItemsToText_itemsWithLineEnds_joinsIntoLines", () => {
    const pages = [[{ str: "Bus depot IT support", hasEOL: true }, { str: "Traced a fault", hasEOL: false }, { str: " in the readers", hasEOL: true }]];
    expect(pdfItemsToText(pages)).toBe("Bus depot IT support\nTraced a fault in the readers");
  });
  test("pdfItemsToText_twoPages_separatedByBlankLine", () => {
    expect(pdfItemsToText([[{ str: "Page one", hasEOL: true }], [{ str: "Page two", hasEOL: true }]])).toBe("Page one\n\nPage two");
  });
  test("pdfItemsToText_extraSpacesAndBlankLines_collapsed", () => {
    const pages = [[{ str: "A   lot   of", hasEOL: false }, { str: " space", hasEOL: true }, { str: "", hasEOL: true }, { str: "", hasEOL: true }, { str: "", hasEOL: true }, { str: "Next", hasEOL: true }]];
    expect(pdfItemsToText(pages)).toBe("A lot of space\n\nNext");
  });
  test("pdfItemsToText_scannedPdfWithoutText_isEmpty", () => {
    expect(pdfItemsToText([[], []])).toBe("");
  });
});

describe("checkPdfFile", () => {
  test("checkPdfFile_pdfUnderLimit_ok", () => {
    expect(checkPdfFile({ type: "application/pdf", name: "cv.pdf", size: 1000 })).toBeNull();
  });
  test("checkPdfFile_pdfExtensionWithoutType_ok", () => {
    expect(checkPdfFile({ type: "", name: "CV.PDF", size: 1000 })).toBeNull();
  });
  test("checkPdfFile_wordDocument_refused", () => {
    expect(checkPdfFile({ type: "application/msword", name: "cv.doc", size: 1000 })).toMatch(/PDF/);
  });
  test("checkPdfFile_tooLarge_refused", () => {
    expect(checkPdfFile({ type: "application/pdf", name: "cv.pdf", size: MAX_PDF_BYTES + 1 })).toMatch(/5 MB/);
  });
});
