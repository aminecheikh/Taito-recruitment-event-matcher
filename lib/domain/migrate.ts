import type { Answer, Db, Entry } from "./types";

/**
 * Upgrades a database saved before requirement cards: one entry per story with accepted links
 * (numbered from 1 in story order), one answer per accepted link to a core requirement,
 * first accepted link wins per (applicant, requirement). Mirrors `buildEntries` in the seed generator.
 */
export function answersFromAcceptedLinks(db: Db): Db {
  const coreIds = new Set(db.requirements.filter((r) => r.isCore).map((r) => r.id));
  const entries: Entry[] = [];
  const answers: Answer[] = [];
  const taken = new Set<string>();
  for (const story of db.stories) {
    const accepted = db.links.filter((l) => l.storyId === story.id && l.status === "accepted");
    if (accepted.length === 0) continue;
    const id = `entry-${entries.length + 1}`;
    entries.push({
      id,
      applicantId: story.applicantId,
      body: story.body,
      ...(story.languageLabel ? { languageLabel: story.languageLabel } : {}),
      sourceStoryId: story.id,
    });
    for (const { requirementId } of accepted) {
      const key = `${story.applicantId}|${requirementId}`;
      if (!coreIds.has(requirementId) || taken.has(key)) continue;
      taken.add(key);
      answers.push({ applicantId: story.applicantId, requirementId, entryId: id });
    }
  }
  return { ...db, entries, answers };
}
