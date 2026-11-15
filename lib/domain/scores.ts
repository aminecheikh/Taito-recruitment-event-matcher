import { coverage, visibleApplicantName } from "./cards";
import { coreRequirements } from "./requirements";
import { ScoreSchema, type Db, type Result, type Score } from "./types";

const MAX_PER_REQUIREMENT = 10;

const sameKey = (a: Score, b: Score) =>
  a.companyId === b.companyId && a.applicantId === b.applicantId && a.requirementId === b.requirementId && a.stage === b.stage;

export function setScore(db: Db, score: Score): Result<Db> {
  const parsed = ScoreSchema.safeParse(score);
  if (!parsed.success) return { ok: false, error: "invalid-score" };
  const isCore = coreRequirements(db, score.companyId).some((r) => r.id === score.requirementId);
  if (!isCore) return { ok: false, error: "not-core" };
  const others = db.scores.filter((s) => !sameKey(s, parsed.data));
  return { ok: true, value: { ...db, scores: [...others, parsed.data] } };
}

/** Weight of each core requirement by position: with N core, #1 weighs N and the last weighs 1. */
export function rankWeights(db: Db, companyId: string): Map<string, number> {
  const core = coreRequirements(db, companyId);
  return new Map(core.map((r, i) => [r.id, core.length - i]));
}

function scoreValue(db: Db, companyId: string, applicantId: string, requirementId: string, stage: Score["stage"]): number | undefined {
  return db.scores.find(
    (s) => s.companyId === companyId && s.applicantId === applicantId && s.stage === stage && s.requirementId === requirementId,
  )?.value;
}

/** Recruiter's own scores weighted by their ranking, out of 100. Undefined until every core requirement is scored. */
export function weightedScore(db: Db, companyId: string, applicantId: string, stage: Score["stage"]): number | undefined {
  const weights = rankWeights(db, companyId);
  if (weights.size === 0) return undefined;
  let earned = 0;
  let possible = 0;
  for (const [requirementId, weight] of weights) {
    const value = scoreValue(db, companyId, applicantId, requirementId, stage);
    if (value === undefined) return undefined;
    earned += value * weight;
    possible += MAX_PER_REQUIREMENT * weight;
  }
  return Math.round((100 * earned) / possible);
}

export type ShortlistRow = {
  applicantId: string;
  label: string;
  covered: number;
  total: number;
  scores: Record<string, number | undefined>;
  weighted?: number;
};

function shortlistRow(db: Db, companyId: string, applicantId: string): ShortlistRow {
  const { covered, total } = coverage(db, companyId, applicantId);
  const scores = Object.fromEntries(
    coreRequirements(db, companyId).map((r) => [r.id, scoreValue(db, companyId, applicantId, r.id, "card")]),
  );
  return {
    applicantId,
    label: visibleApplicantName(db, companyId, applicantId),
    covered,
    total,
    scores,
    weighted: weightedScore(db, companyId, applicantId, "card"),
  };
}

/** Recruiter's shortlist view. A score filter never hides applicants nobody has scored yet. */
export function shortlist(
  db: Db,
  companyId: string,
  applicantIds: string[],
  filter: { minCovered: number; minWeighted?: number },
): { scored: ShortlistRow[]; notScored: ShortlistRow[] } {
  const rows = applicantIds.map((id) => shortlistRow(db, companyId, id)).filter((r) => r.covered >= filter.minCovered);
  const byLabel = (a: ShortlistRow, b: ShortlistRow) => a.label.localeCompare(b.label);
  const scored = rows
    .filter((r) => r.weighted !== undefined && r.weighted >= (filter.minWeighted ?? 0))
    .sort((a, b) => (b.weighted ?? 0) - (a.weighted ?? 0) || byLabel(a, b));
  const notScored = rows.filter((r) => r.weighted === undefined).sort(byLabel);
  return { scored, notScored };
}
