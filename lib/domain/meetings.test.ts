import { describe, expect, test } from "vitest";
import { makeDb } from "./fixtures";
import { acceptMeeting, requestMeeting, slotsLeft } from "./meetings";
import type { Db } from "./types";

const withSlots = (n: number): Db => {
  const db = makeDb();
  return { ...db, companyEvents: db.companyEvents.map((c) => ({ ...c, meetingSlots: n })) };
};

describe("meetings", () => {
  test("requestMeeting_withSignal_addsRequestedMeetingWithoutMutating", () => {
    const db = makeDb();
    const r = requestMeeting(db, "event-01", "company-01", "talent-017");
    expect(r.ok && r.value.meetings).toMatchObject([{ status: "requested", applicantId: "talent-017" }]);
    expect(db.meetings).toEqual([]);
  });
  test("requestMeeting_noSignal_rejects", () =>
    expect(requestMeeting({ ...makeDb(), signals: [] }, "event-01", "company-01", "talent-017")).toEqual({ ok: false, error: "no-signal" }));
  test("requestMeeting_noSlotsLeft_rejects", () => {
    const first = requestMeeting(withSlots(1), "event-01", "company-01", "talent-017");
    if (!first.ok) throw new Error(first.error);
    expect(requestMeeting(first.value, "event-01", "company-01", "talent-020")).toEqual({ ok: false, error: "no-slots-left" });
  });
  test("requestMeeting_twice_rejectsAlreadyRequested", () => {
    const first = requestMeeting(makeDb(), "event-01", "company-01", "talent-017");
    if (!first.ok) throw new Error(first.error);
    expect(requestMeeting(first.value, "event-01", "company-01", "talent-017")).toEqual({ ok: false, error: "already-requested" });
  });
  test("slotsLeft_countsRequestedAndBooked", () => {
    const first = requestMeeting(withSlots(3), "event-01", "company-01", "talent-017");
    if (!first.ok) throw new Error(first.error);
    expect(slotsLeft(withSlots(3), "event-01", "company-01")).toBe(3);
    expect(slotsLeft(first.value, "event-01", "company-01")).toBe(2);
    const booked = acceptMeeting(first.value, first.value.meetings[0].id);
    expect(booked.ok && slotsLeft(booked.value, "event-01", "company-01")).toBe(2);
  });
  test("slotsLeft_noCompanyEvent_isZero", () => expect(slotsLeft(makeDb(), "event-01", "nobody")).toBe(0));
  test("acceptMeeting_requested_becomesBooked", () => {
    const first = requestMeeting(makeDb(), "event-01", "company-01", "talent-017");
    if (!first.ok) throw new Error(first.error);
    const r = acceptMeeting(first.value, first.value.meetings[0].id);
    expect(r.ok && r.value.meetings[0].status).toBe("booked");
    expect(first.value.meetings[0].status).toBe("requested");
  });
  test("acceptMeeting_unknownOrBooked_rejects", () => {
    expect(acceptMeeting(makeDb(), "nope")).toEqual({ ok: false, error: "not-found" });
    const first = requestMeeting(makeDb(), "event-01", "company-01", "talent-017");
    if (!first.ok) throw new Error(first.error);
    const booked = acceptMeeting(first.value, first.value.meetings[0].id);
    if (!booked.ok) throw new Error(booked.error);
    expect(acceptMeeting(booked.value, booked.value.meetings[0].id)).toEqual({ ok: false, error: "not-requested" });
  });
});
