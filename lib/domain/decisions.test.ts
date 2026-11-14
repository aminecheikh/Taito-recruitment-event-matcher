import { describe, expect, test } from "vitest";
import { makeDb } from "./fixtures";
import { recordDecision, revealDecisions, saveShare } from "./decisions";
import type { Db, Decision } from "./types";

const booked = (): Db =>
  makeDb({ meetings: [{ id: "m-1", eventId: "event-01", companyId: "company-01", applicantId: "talent-017", status: "booked" }] });
const feedback = { "req-01-1": "a", "req-01-2": "b", "req-01-3": "c", "req-01-4": "d" };
const applicantYes: Decision = { meetingId: "m-1", side: "applicant", continue: true };
const companyYes: Decision = { meetingId: "m-1", side: "company", continue: true };
const companyNo: Decision = { meetingId: "m-1", side: "company", continue: false, feedback };

function apply(db: Db, ...ds: Decision[]): Db {
  return ds.reduce((acc, d) => {
    const r = recordDecision(acc, d);
    if (!r.ok) throw new Error(r.error);
    return r.value;
  }, db);
}

const part = { contact: "a@example.org" };
const companyPart = { contactPerson: "P", nextStep: "call", timeline: "1 week" };

describe("recordDecision", () => {
  test("recordDecision_bookedMeeting_addsDecisionWithoutMutating", () => {
    const db = booked();
    const r = recordDecision(db, applicantYes);
    expect(r.ok && r.value.decisions).toEqual([applicantYes]);
    expect(db.decisions).toEqual([]);
  });
  test("recordDecision_requestedMeeting_rejectsNotBooked", () => {
    const db = makeDb({ meetings: [{ id: "m-1", eventId: "event-01", companyId: "company-01", applicantId: "talent-017", status: "requested" }] });
    expect(recordDecision(db, applicantYes)).toEqual({ ok: false, error: "not-booked" });
  });
  test("recordDecision_unknownMeeting_rejectsNotFound", () => {
    expect(recordDecision(makeDb(), applicantYes)).toEqual({ ok: false, error: "not-found" });
  });
  test("recordDecision_sameSideTwice_rejectsAlreadyDecided", () => {
    expect(recordDecision(apply(booked(), applicantYes), { ...applicantYes, continue: false })).toEqual({ ok: false, error: "already-decided" });
  });
  test("recordDecision_companyNoWithoutFeedback_rejectsFeedbackMissing", () => {
    const r = recordDecision(booked(), { meetingId: "m-1", side: "company", continue: false });
    expect(r).toEqual({ ok: false, error: "feedback-missing" });
  });
  test("recordDecision_companyNoWithBlankFeedbackLine_rejectsFeedbackMissing", () => {
    const r = recordDecision(booked(), { ...companyNo, feedback: { ...feedback, "req-01-3": "  " } });
    expect(r).toEqual({ ok: false, error: "feedback-missing" });
  });
  test("recordDecision_companyNoWithFeedbackForEveryCore_accepts", () => {
    expect(recordDecision(booked(), companyNo).ok).toBe(true);
  });
  test("recordDecision_applicantNoWithoutFeedback_accepts", () => {
    expect(recordDecision(booked(), { ...applicantYes, continue: false }).ok).toBe(true);
  });
});

describe("revealDecisions", () => {
  test("revealDecisions_oneSideDecided_waits", () => {
    expect(revealDecisions(apply(booked(), applicantYes), "m-1")).toEqual({ status: "waiting" });
  });
  test("revealDecisions_noneDecided_waits", () => {
    expect(revealDecisions(booked(), "m-1")).toEqual({ status: "waiting" });
  });
  test("revealDecisions_bothContinue_revealsMatchWithoutFeedback", () => {
    expect(revealDecisions(apply(booked(), applicantYes, companyYes), "m-1")).toEqual({ status: "revealed", match: true });
  });
  test("revealDecisions_companyNo_revealsNoMatchWithFeedback", () => {
    expect(revealDecisions(apply(booked(), applicantYes, companyNo), "m-1")).toEqual({ status: "revealed", match: false, feedback });
  });
  test("revealDecisions_applicantNoCompanyYes_revealsNoMatch", () => {
    const r = revealDecisions(apply(booked(), { ...applicantYes, continue: false }, companyYes), "m-1");
    expect(r).toEqual({ status: "revealed", match: false });
  });
});

describe("saveShare", () => {
  const matched = () => apply(booked(), applicantYes, companyYes);
  test("saveShare_withoutMatch_rejectsNotAMatch", () => {
    const noMatch = apply(booked(), applicantYes, companyNo);
    expect(saveShare(noMatch, "m-1", part, "applicant")).toEqual({ ok: false, error: "not-a-match" });
  });
  test("saveShare_waiting_rejectsNotAMatch", () => {
    expect(saveShare(booked(), "m-1", part, "applicant")).toEqual({ ok: false, error: "not-a-match" });
  });
  test("saveShare_unknownMeeting_rejectsNotFound", () => {
    expect(saveShare(matched(), "m-9", part, "applicant")).toEqual({ ok: false, error: "not-found" });
  });
  test("saveShare_afterMatch_createsShareWithThatSidePartOnly", () => {
    const db = matched();
    const r = saveShare(db, "m-1", part, "applicant");
    expect(r.ok && r.value.shares).toEqual([{ meetingId: "m-1", applicant: part }]);
    expect(db.shares).toEqual([]);
  });
  test("saveShare_otherSideLater_keepsFirstPart", () => {
    const first = saveShare(matched(), "m-1", part, "applicant");
    if (!first.ok) throw new Error(first.error);
    const second = saveShare(first.value, "m-1", companyPart, "company");
    expect(second.ok && second.value.shares).toEqual([{ meetingId: "m-1", applicant: part, company: companyPart }]);
  });
  test("saveShare_sameSideAgain_replacesThatPart", () => {
    const first = saveShare(matched(), "m-1", part, "applicant");
    if (!first.ok) throw new Error(first.error);
    const second = saveShare(first.value, "m-1", { contact: "b@example.org" }, "applicant");
    expect(second.ok && second.value.shares).toEqual([{ meetingId: "m-1", applicant: { contact: "b@example.org" } }]);
  });
});
