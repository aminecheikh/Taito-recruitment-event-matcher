import type { Db, Event, Meeting } from "./types";

export const SLOT_MINUTES = 30;

const MINUTES_PER_HOUR = 60;

export type CalendarSlot = { start: string; end: string; meeting?: Meeting };
export type Calendar = { slots: CalendarSlot[]; total: number; booked: number; full: boolean };

function toMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * MINUTES_PER_HOUR + minutes;
}

function toTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Slot start times from startTime up to, but excluding, endTime. A partial last slot is dropped. */
export function eventSlots(event: Pick<Event, "startTime" | "endTime">): string[] {
  const end = toMinutes(event.endTime);
  const count = Math.max(0, Math.floor((end - toMinutes(event.startTime)) / SLOT_MINUTES));
  return Array.from({ length: count }, (_, i) => toTime(toMinutes(event.startTime) + i * SLOT_MINUTES));
}

export function slotEnd(slotStart: string): string {
  return toTime(toMinutes(slotStart) + SLOT_MINUTES);
}

function buildCalendar(db: Db, eventId: string, mine: (m: Meeting) => boolean): Calendar {
  const event = db.events.find((e) => e.id === eventId);
  const bookedHere = db.meetings.filter((m) => m.eventId === eventId && m.status === "booked" && mine(m));
  const slots = (event ? eventSlots(event) : []).map((start): CalendarSlot => {
    const meeting = bookedHere.find((m) => m.slotStart === start);
    return meeting ? { start, end: slotEnd(start), meeting } : { start, end: slotEnd(start) };
  });
  const booked = slots.filter((s) => s.meeting).length;
  return { slots, total: slots.length, booked, full: slots.length > 0 && booked === slots.length };
}

export function companyCalendar(db: Db, eventId: string, companyId: string): Calendar {
  return buildCalendar(db, eventId, (m) => m.companyId === companyId);
}

export function applicantCalendar(db: Db, eventId: string, applicantId: string): Calendar {
  return buildCalendar(db, eventId, (m) => m.applicantId === applicantId);
}

/** Slots of the meeting's event where neither the company nor the applicant has a booked meeting. */
export function sharedFreeSlots(db: Db, meetingId: string): string[] {
  const meeting = db.meetings.find((m) => m.id === meetingId);
  if (!meeting) return [];
  const company = companyCalendar(db, meeting.eventId, meeting.companyId);
  const applicant = applicantCalendar(db, meeting.eventId, meeting.applicantId);
  const taken = new Set([...company.slots, ...applicant.slots].filter((s) => s.meeting).map((s) => s.start));
  return company.slots.map((s) => s.start).filter((start) => !taken.has(start));
}

/** Slots the company can still hand out: total minus booked minus pending requests (never below 0). */
export function companyOpenSlots(db: Db, eventId: string, companyId: string): number {
  const attends = db.companyEvents.some((c) => c.eventId === eventId && c.companyId === companyId);
  if (!attends) return 0;
  const { total, booked } = companyCalendar(db, eventId, companyId);
  const pending = db.meetings.filter(
    (m) => m.eventId === eventId && m.companyId === companyId && m.status === "requested",
  ).length;
  return Math.max(0, total - booked - pending);
}
