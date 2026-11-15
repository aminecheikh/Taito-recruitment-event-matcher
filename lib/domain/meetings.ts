import { companyOpenSlots, sharedFreeSlots } from "./calendar";
import type { Db, Result } from "./types";

export function requestMeeting(db: Db, eventId: string, companyId: string, applicantId: string): Result<Db> {
  const signalled = db.signals.some(
    (s) => s.eventId === eventId && s.companyId === companyId && s.applicantId === applicantId,
  );
  if (!signalled) return { ok: false, error: "no-signal" };
  const companyAtEvent = db.companyEvents.some((c) => c.eventId === eventId && c.companyId === companyId);
  const applicantAtEvent = db.applicantEvents.some((a) => a.eventId === eventId && a.applicantId === applicantId);
  if (!companyAtEvent || !applicantAtEvent) return { ok: false, error: "not-at-event" };
  const existing = db.meetings.some(
    (m) => m.eventId === eventId && m.companyId === companyId && m.applicantId === applicantId,
  );
  if (existing) return { ok: false, error: "already-requested" };
  if (companyOpenSlots(db, eventId, companyId) <= 0) return { ok: false, error: "no-slots-left" };
  const meeting = {
    id: `meeting-${eventId}-${companyId}-${applicantId}`,
    eventId,
    companyId,
    applicantId,
    status: "requested" as const,
  };
  return { ok: true, value: { ...db, meetings: [...db.meetings, meeting] } };
}

export function acceptMeeting(db: Db, meetingId: string, slotStart: string): Result<Db> {
  const meeting = db.meetings.find((m) => m.id === meetingId);
  if (!meeting) return { ok: false, error: "not-found" };
  if (meeting.status !== "requested") return { ok: false, error: "not-requested" };
  if (!sharedFreeSlots(db, meetingId).includes(slotStart)) return { ok: false, error: "slot-unavailable" };
  const meetings = db.meetings.map((m) => (m.id === meetingId ? { ...m, status: "booked" as const, slotStart } : m));
  return { ok: true, value: { ...db, meetings } };
}

/** Meeting requests from companies that this applicant has not answered yet at this event. */
export function pendingRequestCount(db: Db, eventId: string, applicantId: string): number {
  return db.meetings.filter((m) => m.eventId === eventId && m.applicantId === applicantId && m.status === "requested").length;
}
