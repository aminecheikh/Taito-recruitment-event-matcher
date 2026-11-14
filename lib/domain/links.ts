import type { Db, Link, Result } from "./types";

export type LinkSuggestion = { requirementId: string; reason: string };

const linkId = (storyId: string, requirementId: string) => `link-${storyId}-${requirementId}`;
const samePair = (l: Link, storyId: string, requirementId: string) =>
  l.storyId === storyId && l.requirementId === requirementId;

/** Adds pending AI links. Pairs that already exist in any state (including rejected) are skipped. */
export function addSuggestions(db: Db, storyId: string, suggestions: LinkSuggestion[]): Db {
  const fresh = suggestions.reduce<Link[]>((acc, s) => {
    const exists = [...db.links, ...acc].some((l) => samePair(l, storyId, s.requirementId));
    if (exists) return acc;
    const link: Link = {
      id: linkId(storyId, s.requirementId),
      storyId,
      requirementId: s.requirementId,
      origin: "ai-suggested",
      aiReason: s.reason,
      status: "pending",
    };
    return [...acc, link];
  }, []);
  return { ...db, links: [...db.links, ...fresh] };
}

function setStatus(db: Db, id: string, status: Link["status"]): Result<Db> {
  if (!db.links.some((l) => l.id === id)) return { ok: false, error: "not-found" };
  return { ok: true, value: { ...db, links: db.links.map((l) => (l.id === id ? { ...l, status } : l)) } };
}

export const acceptLink = (db: Db, id: string): Result<Db> => setStatus(db, id, "accepted");
export const rejectLink = (db: Db, id: string): Result<Db> => setStatus(db, id, "rejected");

/** Replaces any link on the pair with one accepted applicant-origin link. */
function upsertApplicantLink(links: Link[], storyId: string, requirementId: string): Link[] {
  const rest = links.filter((l) => !samePair(l, storyId, requirementId));
  return [...rest, { id: linkId(storyId, requirementId), storyId, requirementId, origin: "applicant", status: "accepted" }];
}

/** Moves a link to another requirement of the same company; the applicant's choice makes it accepted. */
export function moveLink(db: Db, id: string, toRequirementId: string): Result<Db> {
  const link = db.links.find((l) => l.id === id);
  const from = db.requirements.find((r) => r.id === link?.requirementId);
  const to = db.requirements.find((r) => r.id === toRequirementId);
  if (!link || !from || !to) return { ok: false, error: "not-found" };
  if (from.companyId !== to.companyId) return { ok: false, error: "other-company" };
  const others = db.links.filter((l) => l.id !== id);
  return { ok: true, value: { ...db, links: upsertApplicantLink(others, link.storyId, to.id) } };
}

export function linkManually(db: Db, storyId: string, requirementId: string): Result<Db> {
  const known =
    db.stories.some((s) => s.id === storyId) && db.requirements.some((r) => r.id === requirementId);
  if (!known) return { ok: false, error: "not-found" };
  return { ok: true, value: { ...db, links: upsertApplicantLink(db.links, storyId, requirementId) } };
}
