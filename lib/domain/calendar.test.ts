import { describe, expect, test } from "vitest";
import {
  SLOT_MINUTES,
  applicantCalendar,
  companyCalendar,
  companyOpenSlots,
  eventSlots,
  sharedFreeSlots,
  slotEnd,
} from "./calendar";
import { makeDb } from "./fixtures";
import type { Db, Meeting } from "./types";

const EVENT = "event-01";

function booking(id: string, companyId: string, applicantId: string, slotStart: string): Meeting {
  return { id, eventId: EVENT, companyId, applicantId, status: "booked", slotStart };
}

function withMeetings(meetings: Meeting[]): Db {
  return { ...makeDb(), meetings };
}

describe("calendar", () => {
  test("SLOT_MINUTES_always_isThirty", () => expect(SLOT_MINUTES).toBe(30));

  test("eventSlots_fourHourWindow_returnsEightSlots", () => {
    expect(eventSlots({ startTime: "14:00", endTime: "18:00" })).toEqual([
      "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
    ]);
  });

  test("eventSlots_threeHourWindow_returnsSixSlots", () => {
    expect(eventSlots({ startTime: "10:00", endTime: "13:00" })).toEqual([
      "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
    ]);
  });

  test("eventSlots_windowNotMultipleOfSlot_dropsPartialSlot", () => {
    expect(eventSlots({ startTime: "10:00", endTime: "11:15" })).toEqual(["10:00", "10:30"]);
  });

  test("slotEnd_halfHourStart_returnsNextHour", () => expect(slotEnd("14:30")).toBe("15:00"));
  test("slotEnd_hourStart_returnsHalfPast", () => expect(slotEnd("09:00")).toBe("09:30"));

  test("companyCalendar_noMeetings_allSlotsFreeAndNotFull", () => {
    const cal = companyCalendar(makeDb(), EVENT, "company-01");
    expect(cal).toMatchObject({ total: 8, booked: 0, full: false });
    expect(cal.slots[0]).toEqual({ start: "14:00", end: "14:30" });
  });

  test("companyCalendar_oneBooking_marksThatSlotWithMeeting", () => {
    const m = booking("m1", "company-01", "talent-017", "15:00");
    const cal = companyCalendar(withMeetings([m]), EVENT, "company-01");
    expect(cal.booked).toBe(1);
    expect(cal.slots.find((s) => s.start === "15:00")?.meeting).toEqual(m);
  });

  test("companyCalendar_requestedMeeting_doesNotCountAsBooked", () => {
    const requested: Meeting = { id: "m1", eventId: EVENT, companyId: "company-01", applicantId: "talent-017", status: "requested" };
    expect(companyCalendar(withMeetings([requested]), EVENT, "company-01").booked).toBe(0);
  });

  test("companyCalendar_everySlotBooked_isFull", () => {
    const starts = eventSlots({ startTime: "14:00", endTime: "18:00" });
    const meetings = starts.map((s, i) => booking(`m${i}`, "company-01", `talent-${i}`, s));
    expect(companyCalendar(withMeetings(meetings), EVENT, "company-01")).toMatchObject({ total: 8, booked: 8, full: true });
  });

  test("companyCalendar_unknownEvent_isEmptyAndNotFull", () => {
    expect(companyCalendar(makeDb(), "nope", "company-01")).toEqual({ slots: [], total: 0, booked: 0, full: false });
  });

  test("applicantCalendar_bookingWithAnyCompany_marksSlot", () => {
    const m = booking("m1", "company-02", "talent-017", "14:30");
    const cal = applicantCalendar(withMeetings([m]), EVENT, "talent-017");
    expect(cal.booked).toBe(1);
    expect(cal.slots[1]?.meeting).toEqual(m);
    expect(applicantCalendar(withMeetings([m]), EVENT, "talent-020").booked).toBe(0);
  });

  test("sharedFreeSlots_noBookings_returnsAllEventSlots", () => {
    const db: Db = withMeetings([
      { id: "m1", eventId: EVENT, companyId: "company-01", applicantId: "talent-017", status: "requested" },
    ]);
    expect(sharedFreeSlots(db, "m1")).toHaveLength(8);
  });

  test("sharedFreeSlots_bothSidesBooked_excludesBothSidesSlots", () => {
    const db = withMeetings([
      { id: "m1", eventId: EVENT, companyId: "company-01", applicantId: "talent-017", status: "requested" },
      booking("m2", "company-01", "talent-020", "14:00"),
      booking("m3", "company-02", "talent-017", "16:00"),
      booking("m4", "company-02", "talent-020", "17:00"),
    ]);
    expect(sharedFreeSlots(db, "m1")).toEqual(["14:30", "15:00", "15:30", "16:30", "17:00", "17:30"]);
  });

  test("sharedFreeSlots_unknownMeeting_returnsEmpty", () => expect(sharedFreeSlots(makeDb(), "nope")).toEqual([]));

  test("companyOpenSlots_pendingRequestsAndBookings_areSubtracted", () => {
    const db = withMeetings([
      { id: "m1", eventId: EVENT, companyId: "company-01", applicantId: "talent-017", status: "requested" },
      booking("m2", "company-01", "talent-020", "14:00"),
    ]);
    expect(companyOpenSlots(db, EVENT, "company-01")).toBe(6);
  });

  test("companyOpenSlots_moreMeetingsThanSlots_isZero", () => {
    const meetings: Meeting[] = Array.from({ length: 9 }, (_, i) => ({
      id: `m${i}`, eventId: EVENT, companyId: "company-01", applicantId: `talent-${i}`, status: "requested" as const,
    }));
    expect(companyOpenSlots(withMeetings(meetings), EVENT, "company-01")).toBe(0);
  });

  test("companyOpenSlots_companyNotAtEvent_isZero", () => {
    expect(companyOpenSlots(makeDb(), EVENT, "nobody")).toBe(0);
  });
});
