import type { Applicant, Result, Share } from "./types";

export type ShareChoice = {
  shareEmail: boolean;
  shareCv: boolean;
  cvUrl: string;
  sharePortfolio: boolean;
  portfolioUrl: string;
};

/** True only for well-formed http(s) URLs. */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/** Builds the applicant's share part from their choices; the email always comes from their own contact. */
export function buildApplicantShare(applicant: Applicant, choice: ShareChoice): Result<NonNullable<Share["applicant"]>> {
  if (choice.shareCv && !isHttpUrl(choice.cvUrl)) return { ok: false, error: "invalid-cv-url" };
  if (choice.sharePortfolio && !isHttpUrl(choice.portfolioUrl)) return { ok: false, error: "invalid-portfolio-url" };
  return {
    ok: true,
    value: {
      ...(choice.shareEmail ? { contact: applicant.contact.email } : {}),
      ...(choice.shareCv ? { cvUrl: choice.cvUrl.trim() } : {}),
      ...(choice.sharePortfolio ? { links: [choice.portfolioUrl.trim()] } : {}),
    },
  };
}
