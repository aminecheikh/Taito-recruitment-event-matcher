import { coreRequirements } from "./requirements";
import type { Db, Entry, Requirement } from "./types";

export type CardSlot = {
  requirement: Requirement;
  example: { entry: Pick<Entry, "id" | "body" | "languageLabel"> } | null;
};
export type Card = { applicantId: string; label: string; slots: CardSlot[] };

export function visibleApplicantName(db: Db, companyId: string, applicantId: string): string {
  const applicant = db.applicants.find((a) => a.id === applicantId);
  if (!applicant) return applicantId;
  const booked = db.meetings.some(
    (m) => m.companyId === companyId && m.applicantId === applicantId && m.status === "booked",
  );
  return booked ? applicant.displayName : applicant.pseudonym;
}

function buildSlot(db: Db, applicantId: string, requirement: Requirement): CardSlot {
  const answer = db.answers.find((a) => a.applicantId === applicantId && a.requirementId === requirement.id);
  const found = answer && db.entries.find((e) => e.id === answer.entryId && e.applicantId === applicantId);
  if (!found) return { requirement, example: null };
  const { id, body, languageLabel } = found;
  return { requirement, example: { entry: { id, body, languageLabel } } };
}

export function buildCard(db: Db, companyId: string, applicantId: string): Card {
  const slots = coreRequirements(db, companyId).map((r) => buildSlot(db, applicantId, r));
  return { applicantId, label: visibleApplicantName(db, companyId, applicantId), slots };
}

export function coverage(db: Db, companyId: string, applicantId: string): { covered: number; total: number } {
  const slots = coreRequirements(db, companyId).map((r) => buildSlot(db, applicantId, r));
  return { covered: slots.filter((s) => s.example !== null).length, total: slots.length };
}

export function filterByCoverage(db: Db, companyId: string, applicantIds: string[], minCovered: number): string[] {
  return applicantIds.filter((id) => coverage(db, companyId, id).covered >= minCovered);
}
