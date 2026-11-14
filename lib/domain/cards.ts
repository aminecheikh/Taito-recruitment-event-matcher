import { coreRequirements } from "./requirements";
import type { Db, Link, Requirement, Story } from "./types";

export type CardSlot = {
  requirement: Requirement;
  examples: { story: Pick<Story, "id" | "title" | "body" | "languageLabel">; origin: Link["origin"] }[];
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
  const examples = db.links
    .filter((l) => l.status === "accepted" && l.requirementId === requirement.id)
    .flatMap((l) => {
      const story = db.stories.find((s) => s.id === l.storyId && s.applicantId === applicantId);
      if (!story) return [];
      const { id, title, body, languageLabel } = story;
      return [{ story: { id, title, body, languageLabel }, origin: l.origin }];
    });
  return { requirement, examples };
}

export function buildCard(db: Db, companyId: string, applicantId: string): Card {
  const slots = coreRequirements(db, companyId).map((r) => buildSlot(db, applicantId, r));
  return { applicantId, label: visibleApplicantName(db, companyId, applicantId), slots };
}

export function coverage(db: Db, companyId: string, applicantId: string): { covered: number; total: number } {
  const slots = coreRequirements(db, companyId).map((r) => buildSlot(db, applicantId, r));
  return { covered: slots.filter((s) => s.examples.length > 0).length, total: slots.length };
}

export function filterByCoverage(db: Db, companyId: string, applicantIds: string[], minCovered: number): string[] {
  return applicantIds.filter((id) => coverage(db, companyId, id).covered >= minCovered);
}
