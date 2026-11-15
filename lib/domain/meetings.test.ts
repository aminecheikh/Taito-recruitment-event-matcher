import { describe, expect, test } from "vitest";
import { makeDb } from "./fixtures";
import { acceptMeeting, pendingRequestCount, requestMeeting } from "./meetings";
import type { Db, Meeting } from "./types";

const EVENT = "event-01";

function requested(db: Db, applicantId = "talent-017", companyId = "company-01"): Db {
  const r = requestMeeting(db, EVENT, companyId, applicantId);
  if (!r.ok) throw new Error(r.error);
  return r.value;
}

function withBooking(db: Db, companyId: string, applicantId: string, slotStart: string): Db {
  const m: Meeting = { id: `b-${slotStart}`, eventId: EVENT, companyId, applicantId, status: "booked", slotStart };
  return { ...db, meetings: [...db.meetings, m] };
}

describe("requestMeeting", () => {
  test("requestMeeting_withSignal_addsRequestedMeetingWithoutMutating", () => {
    const db = makeDb();
    const r = requestMeeting(db, EVENT, "company-01", "talent-017");
    expect(r.ok && r.value.meetings).toMatchObject([{ status: "requested", applicantId: "talent-017" }]);
    expect(r.ok && r.value.meetings[0]?.slotStart).toBeUndefined();
    expect(db.meetings).toEqual([]);
  });
  test("requestMeeting_noSignal_rejects", () =>
    expect(requestMeeting({ ...makeDb(), signals: [] }, EVENT, "company-01", "talent-017")).toEqual({ ok: false, error: "no-signal" }));
  test("requestMeeting_companyNotAtEvent_rejectsNotAtEvent", () =>
    expect(requestMeeting({ ...makeDb(), companyEvents: [] }, EVENT, "company-01", "talent-017")).toEqual({ ok: false, error: "not-at-event" }));
  test("requestMeeting_applicantNotRegistered_rejectsNotAtEvent", () =>
    expect(requestMeeting({ ...makeDb(), applicantEvents: [] }, EVENT, "company-01", "talent-017")).toEqual({ ok: false, error: "not-at-event" }));
  test("requestMeeting_noOpenSlots_rejects", () => {
    const db = makeDb();
    const full = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"].reduce(
      (acc, s, i) => withBooking(acc, "company-01", `talent-x${i}`, s),
      db,
    );
    expect(requestMeeting(full, EVENT, "company-01", "talent-017")).toEqual({ ok: false, error: "no-slots-left" });
  });
  test("requestMeeting_twice_rejectsAlreadyRequested", () =>
    expect(requestMeeting(requested(makeDb()), EVENT, "company-01", "talent-017")).toEqual({ ok: false, error: "already-requested" }));
});

describe("acceptMeeting", () => {
  test("acceptMeeting_freeSlot_booksWithSlotStartWithoutMutating", () => {
    const db = requested(makeDb());
    const id = db.meetings[0]!.id;
    const r = acceptMeeting(db, id, "15:00");
    expect(r.ok && r.value.meetings[0]).toMatchObject({ status: "booked", slotStart: "15:00" });
    expect(db.meetings[0]).toMatchObject({ status: "requested" });
  });
  test("acceptMeeting_slotTakenByCompany_rejectsSlotUnavailable", () => {
    const db = withBooking(requested(makeDb()), "company-01", "talent-020", "15:00");
    expect(acceptMeeting(db, db.meetings[0]!.id, "15:00")).toEqual({ ok: false, error: "slot-unavailable" });
  });
  test("acceptMeeting_slotTakenByApplicant_rejectsSlotUnavailable", () => {
    const db = withBooking(requested(makeDb()), "company-02", "talent-017", "15:00");
    expect(acceptMeeting(db, db.meetings[0]!.id, "15:00")).toEqual({ ok: false, error: "slot-unavailable" });
  });
  test("acceptMeeting_slotOutsideEventWindow_rejectsSlotUnavailable", () => {
    const db = requested(makeDb());
    expect(acceptMeeting(db, db.meetings[0]!.id, "09:00")).toEqual({ ok: false, error: "slot-unavailable" });
  });
  test("acceptMeeting_unknownMeeting_rejectsNotFound", () =>
    expect(acceptMeeting(makeDb(), "nope", "15:00")).toEqual({ ok: false, error: "not-found" }));
  test("acceptMeeting_alreadyBooked_rejectsNotRequested", () => {
    const db = requested(makeDb());
    const booked = acceptMeeting(db, db.meetings[0]!.id, "15:00");
    if (!booked.ok) throw new Error(booked.error);
    expect(acceptMeeting(booked.value, db.meetings[0]!.id, "16:00")).toEqual({ ok: false, error: "not-requested" });
  });
});

describe("pendingRequestCount", () => {
  const meeting = (id: string, over: Partial<Meeting>): Meeting => ({
    id, eventId: "e1", companyId: "c1", applicantId: "a1", status: "requested", ...over,
  });
  const db = (meetings: Meeting[]): Db => ({ ...makeDb(), meetings });

  test("pendingRequestCount_noMeetings_isZero", () => {
    expect(pendingRequestCount(db([]), "e1", "a1")).toBe(0);
  });
  test("pendingRequestCount_countsOnlyUnansweredRequestsForThisApplicantAndEvent", () => {
    const meetings = [
      meeting("m1", {}),
      meeting("m2", { companyId: "c2" }),
      meeting("m3", { status: "booked", slotStart: "14:00" }),
      meeting("m4", { applicantId: "a2" }),
      meeting("m5", { eventId: "e2" }),
    ];
    expect(pendingRequestCount(db(meetings), "e1", "a1")).toBe(2);
  });
});
