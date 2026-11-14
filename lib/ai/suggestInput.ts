import { coreRequirements } from "@/lib/domain/requirements";
import type { Db, Requirement } from "@/lib/domain/types";

export type SuggestInput = {
  story: { id: string; body: string };
  requirements: Requirement[];
};

/**
 * Builds suggestLinks input for a story the caller owns, plus all core requirements of
 * companies at the event. Returns null for unknown stories and other applicants' stories
 * (indistinguishable, so story ids cannot be probed).
 */
export function findOwnSuggestInput(
  db: Db,
  storyId: string,
  applicantId: string,
  eventId: string,
): SuggestInput | null {
  const story = db.stories.find((s) => s.id === storyId && s.applicantId === applicantId);
  if (!story) return null;
  const companyIds = db.companyEvents.filter((ce) => ce.eventId === eventId).map((ce) => ce.companyId);
  return {
    story: { id: story.id, body: story.body },
    requirements: companyIds.flatMap((id) => coreRequirements(db, id)),
  };
}
