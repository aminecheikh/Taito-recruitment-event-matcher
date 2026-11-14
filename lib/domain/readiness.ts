import type { Db } from "./types";

export type ReadinessRow = { applicantId: string; pseudonym: string; stories: number; acceptedLinks: number };

export function needsHelp(db: Db): ReadinessRow[] {
  return db.applicants
    .map((a) => {
      const storyIds = new Set(db.stories.filter((s) => s.applicantId === a.id).map((s) => s.id));
      const acceptedLinks = db.links.filter((l) => l.status === "accepted" && storyIds.has(l.storyId)).length;
      return { applicantId: a.id, pseudonym: a.pseudonym, stories: storyIds.size, acceptedLinks };
    })
    .filter((row) => row.stories === 0 || row.acceptedLinks === 0)
    .sort((a, b) => a.pseudonym.localeCompare(b.pseudonym));
}
