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

export function totalScore(
  db: Db,
  companyId: string,
  applicantId: string,
  stage: Score["stage"],
): { total: number; max: number } | undefined {
  const core = coreRequirements(db, companyId);
  const values = core.map(
    (r) => db.scores.find((s) => s.companyId === companyId && s.applicantId === applicantId && s.stage === stage && s.requirementId === r.id)?.value,
  );
  if (core.length === 0 || values.some((v) => v === undefined)) return undefined;
  return { total: values.reduce<number>((sum, v) => sum + (v ?? 0), 0), max: MAX_PER_REQUIREMENT * core.length };
}
