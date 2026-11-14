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
  return { ok: true, value: { ...db, requirements: [...others, ...reqs] } };
}

export function coreRequirements(db: Db, companyId: string): Requirement[] {
  return db.requirements
    .filter((r) => r.companyId === companyId && r.isCore)
    .sort((a, b) => a.rank - b.rank);
}
