import type { Db, Result } from "./types";

export function slotsLeft(db: Db, eventId: string, companyId: string): number {
  const slots = db.companyEvents.find((c) => c.eventId === eventId && c.companyId === companyId)?.meetingSlots ?? 0;
  const used = db.meetings.filter((m) => m.eventId === eventId && m.companyId === companyId).length;
  return Math.max(0, slots - used);
}

export function requestMeeting(db: Db, eventId: string, companyId: string, applicantId: string): Result<Db> {
  const signalled = db.signals.some(
    (s) => s.eventId === eventId && s.companyId === companyId && s.applicantId === applicantId,
  );
  if (!signalled) return { ok: false, error: "no-signal" };
  const existing = db.meetings.some(
    (m) => m.eventId === eventId && m.companyId === companyId && m.applicantId === applicantId,
  );
  if (existing) return { ok: false, error: "already-requested" };
  if (slotsLeft(db, eventId, companyId) <= 0) return { ok: false, error: "no-slots-left" };
  const meeting = {
    id: `meeting-${eventId}-${companyId}-${applicantId}`,
    eventId,
    companyId,
    applicantId,
    status: "requested" as const,
  };
  return { ok: true, value: { ...db, meetings: [...db.meetings, meeting] } };
}

export function acceptMeeting(db: Db, meetingId: string): Result<Db> {
  const meeting = db.meetings.find((m) => m.id === meetingId);
  if (!meeting) return { ok: false, error: "not-found" };
  if (meeting.status !== "requested") return { ok: false, error: "not-requested" };
  const meetings = db.meetings.map((m) => (m.id === meetingId ? { ...m, status: "booked" as const } : m));
  return { ok: true, value: { ...db, meetings } };
}
