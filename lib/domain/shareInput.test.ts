import { describe, expect, it } from "vitest";
import { buildApplicantShare, isHttpUrl } from "./shareInput";

const applicant = { id: "a", pseudonym: "p", displayName: "n", contact: { email: "a@example.org" } };
const none = { shareEmail: false, shareCv: false, cvUrl: "", sharePortfolio: false, portfolioUrl: "" };

describe("isHttpUrl", () => {
  it("test_isHttpUrl_httpAndHttps_true", () => {
    expect(isHttpUrl("https://example.org/cv.pdf")).toBe(true);
    expect(isHttpUrl(" http://example.org ")).toBe(true);
  });
  it("test_isHttpUrl_otherSchemesOrText_false", () => {
    expect(isHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isHttpUrl("ftp://example.org")).toBe(false);
    expect(isHttpUrl("example.org")).toBe(false);
    expect(isHttpUrl("")).toBe(false);
  });
});

describe("buildApplicantShare", () => {
  it("test_buildApplicantShare_nothingChecked_emptyPart", () => {
    expect(buildApplicantShare(applicant, none)).toEqual({ ok: true, value: {} });
  });
  it("test_buildApplicantShare_allChecked_usesOwnEmailAndTrimmedUrls", () => {
    const r = buildApplicantShare(applicant, {
      shareEmail: true, shareCv: true, cvUrl: " https://x.org/cv ", sharePortfolio: true, portfolioUrl: "https://x.org/p",
    });
    expect(r).toEqual({ ok: true, value: { contact: "a@example.org", cvUrl: "https://x.org/cv", links: ["https://x.org/p"] } });
  });
  it("test_buildApplicantShare_badCvUrl_error", () => {
    expect(buildApplicantShare(applicant, { ...none, shareCv: true, cvUrl: "nope" })).toEqual({ ok: false, error: "invalid-cv-url" });
  });
  it("test_buildApplicantShare_badPortfolioUrl_error", () => {
    expect(buildApplicantShare(applicant, { ...none, sharePortfolio: true, portfolioUrl: "" })).toEqual({ ok: false, error: "invalid-portfolio-url" });
  });
  it("test_buildApplicantShare_uncheckedBadUrl_ignored", () => {
    expect(buildApplicantShare(applicant, { ...none, cvUrl: "nope" })).toEqual({ ok: true, value: {} });
  });
});
