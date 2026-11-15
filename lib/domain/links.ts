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

export const rejectLink = (db: Db, id: string): Result<Db> => setStatus(db, id, "rejected");
