import { MAX_CORE_REQUIREMENTS, type Db, type Requirement, type Result } from "./types";

export function validateCore(reqs: Requirement[]): Result<Requirement[]> {
  const coreCount = reqs.filter((r) => r.isCore).length;
  if (coreCount === 0) return { ok: false, error: "no-core" };
  if (coreCount > MAX_CORE_REQUIREMENTS) return { ok: false, error: "too-many-core" };
  const ranks = new Set(reqs.map((r) => r.rank));
  if (ranks.size !== reqs.length) return { ok: false, error: "duplicate-rank" };
  return { ok: true, value: reqs };
}

export function setRequirements(db: Db, companyId: string, reqs: Requirement[]): Result<Db> {
  if (reqs.some((r) => r.companyId !== companyId)) return { ok: false, error: "company-mismatch" };
  const valid = validateCore(reqs);
  if (!valid.ok) return valid;
  const others = db.requirements.filter((r) => r.companyId !== companyId);
  const keptIds = new Set(reqs.map((r) => r.id));
  const removedIds = new Set(
    db.requirements.filter((r) => r.companyId === companyId && !keptIds.has(r.id)).map((r) => r.id),
  );
  return {
    ok: true,
    value: {
      ...db,
      requirements: [...others, ...reqs],
      // A deleted requirement takes the examples linked to it and the scores given on it with it.
      links: db.links.filter((l) => !removedIds.has(l.requirementId)),
      scores: db.scores.filter((s) => !removedIds.has(s.requirementId)),
    },
  };
}

export function coreRequirements(db: Db, companyId: string): Requirement[] {
  return db.requirements
    .filter((r) => r.companyId === companyId && r.isCore)
    .sort((a, b) => a.rank - b.rank);
}
