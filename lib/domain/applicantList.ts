import { filterByCoverage } from "./cards";
import { companyOpenSlots } from "./calendar";
import { requestMeeting } from "./meetings";
import { shortlist } from "./scores";
import type { Db, Result } from "./types";

/** minWeighted: the recruiter's own weighted-score floor; applicants they have not scored yet always stay. */
export type ListFilter = { minCovered: number; markedOnly: boolean; minWeighted?: number };

const hasSignal = (db: Db, eventId: string, companyId: string, applicantId: string) =>
  db.signals.some((s) => s.eventId === eventId && s.companyId === companyId && s.applicantId === applicantId);

const hasMeeting = (db: Db, eventId: string, companyId: string, applicantId: string) =>
  db.meetings.some((m) => m.eventId === eventId && m.companyId === companyId && m.applicantId === applicantId);

export function isMarked(db: Db, eventId: string, companyId: string, applicantId: string): boolean {
  return db.marks.some((m) => m.eventId === eventId && m.companyId === companyId && m.applicantId === applicantId);
}

/** Same rule as the shortlist table's score filter: scored applicants at or above the floor, plus everyone not scored. */
function scoreFloor(db: Db, companyId: string, ids: string[], minWeighted: number): string[] {
  const { scored, notScored } = shortlist(db, companyId, ids, { minCovered: 0, minWeighted });
  const keep = new Set([...scored, ...notScored].map((r) => r.applicantId));
  return ids.filter((id) => keep.has(id));
}

/**
 * The recruiter's applicant list: who signalled the company at this event and has no meeting with it
 * yet (invited applicants move to Meetings), narrowed by coverage and the marked-for-later filter,
 * in pseudonym order. The page and the AI search both use this, so the AI only sees the list shown.
 */
export function recruiterList(db: Db, eventId: string, companyId: string, filter: ListFilter): string[] {
  const open = db.signals
    .filter((s) => s.eventId === eventId && s.companyId === companyId)
    .map((s) => s.applicantId)
    .filter((id) => !hasMeeting(db, eventId, companyId, id))
    .filter((id) => !filter.markedOnly || isMarked(db, eventId, companyId, id));
  const pseudonym = (id: string) => db.applicants.find((a) => a.id === id)?.pseudonym ?? id;
  const covered = filterByCoverage(db, companyId, open, filter.minCovered);
  const passed = filter.minWeighted === undefined ? covered : scoreFloor(db, companyId, covered, filter.minWeighted);
  return passed.sort((a, b) => pseudonym(a).localeCompare(pseudonym(b)));
}

export type InviteOutcome = { db: Db; invited: number; alreadyInvited: number };

export type InviteError =
  | { error: "no-signal" | "not-at-event" | "nothing-selected" }
  | { error: "not-enough-slots"; selected: number; slotsLeft: number };

/**
 * Bulk wrapper around requestMeeting: all new invites go through or none do. Applicants who already
 * have a meeting are skipped and counted. When the new invites need more slots than are open,
 * nothing is sent so the recruiter can recheck the selection.
 */
export function requestMeetings(
  db: Db,
  eventId: string,
  companyId: string,
  applicantIds: readonly string[],
): { ok: true; value: InviteOutcome } | ({ ok: false } & InviteError) {
  const unique = [...new Set(applicantIds)];
  if (unique.length === 0) return { ok: false, error: "nothing-selected" };
  if (unique.some((id) => !hasSignal(db, eventId, companyId, id))) return { ok: false, error: "no-signal" };
  const fresh = unique.filter((id) => !hasMeeting(db, eventId, companyId, id));
  const slotsLeft = companyOpenSlots(db, eventId, companyId);
  if (fresh.length > slotsLeft) return { ok: false, error: "not-enough-slots", selected: fresh.length, slotsLeft };

  let next = db;
  for (const id of fresh) {
    const result = requestMeeting(next, eventId, companyId, id);
    if (!result.ok) return { ok: false, error: result.error === "not-at-event" ? "not-at-event" : "no-signal" };
    next = result.value;
  }
  return { ok: true, value: { db: next, invited: fresh.length, alreadyInvited: unique.length - fresh.length } };
}

/** Marks or unmarks applicants for later. Reversible and idempotent; only applicants who signalled. */
export function setMarked(
  db: Db,
  eventId: string,
  companyId: string,
  applicantIds: readonly string[],
  marked: boolean,
): Result<Db> {
  const unique = [...new Set(applicantIds)];
  if (unique.length === 0) return { ok: false, error: "nothing-selected" };
  if (unique.some((id) => !hasSignal(db, eventId, companyId, id))) return { ok: false, error: "no-signal" };
  const chosen = new Set(unique);
  const others = db.marks.filter(
    (m) => !(m.eventId === eventId && m.companyId === companyId && chosen.has(m.applicantId)),
  );
  const added = marked ? unique.map((applicantId) => ({ eventId, companyId, applicantId })) : [];
  return { ok: true, value: { ...db, marks: [...others, ...added] } };
}
