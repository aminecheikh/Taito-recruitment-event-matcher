import type { Db } from "./types";

export type ReadinessRow = { applicantId: string; pseudonym: string; stories: number; answers: number };

export function needsHelp(db: Db): ReadinessRow[] {
  return db.applicants
    .map((a) => ({
      applicantId: a.id,
      pseudonym: a.pseudonym,
      stories: db.stories.filter((s) => s.applicantId === a.id).length,
      answers: db.answers.filter((ans) => ans.applicantId === a.id).length,
    }))
    .filter((row) => row.stories === 0 || row.answers === 0)
    .sort((a, b) => a.pseudonym.localeCompare(b.pseudonym));
}
