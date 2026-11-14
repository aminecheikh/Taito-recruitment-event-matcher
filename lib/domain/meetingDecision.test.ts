import { describe, expect, test } from "vitest";
import { makeDb } from "./fixtures";
import { applyDecision, ShareDetailsSchema } from "./meetingDecision";
import { coreRequirements } from "./requirements";
import type { Db } from "./types";

const meeting = (companyId = "company-01") => ({
  id: "m-1", eventId: "event-01", companyId, applicantId: "talent-017", status: "booked" as const,
});
const base = (): Db => makeDb({ meetings: [meeting()] });
const coreIds = (db: Db) => coreRequirements(db, "company-01").map((r) => r.id);
const allScores = (db: Db) => Object.fromEntries(coreIds(db).map((id) => [id, 7]));
const allFeedback = (db: Db) => Object.fromEntries(coreIds(db).map((id) => [id, "more depth"]));

describe("applyDecision", () => {
  test("applyDecision_otherCompanysMeeting_returnsNotFound", () => {
    const db = makeDb({ meetings: [meeting("company-02")] });
    expect(applyDecision(db, "m-1", "company-01", { scores: allScores(db), continue: true, feedback: {} })).toEqual({ ok: false, error: "not-found" });
  });
  test("applyDecision_missingScores_returnsScoresMissing", () => {
    const db = base();
    const [first] = coreIds(db);
    expect(applyDecision(db, "m-1", "company-01", { scores: { [first]: 5 }, continue: true, feedback: {} })).toEqual({ ok: false, error: "scores-missing" });
  });
  test("applyDecision_notThisTimeMissingFeedback_refusedAndNothingWritten", () => {
    const db = base();
    const r = applyDecision(db, "m-1", "company-01", { scores: allScores(db), continue: false, feedback: {} });
    expect(r).toEqual({ ok: false, error: "feedback-missing" });
    expect(db.scores).toEqual([]);
    expect(db.decisions).toEqual([]);
  });
  test("applyDecision_notThisTimeWithFeedback_writesDecisionAndScores", () => {
    const db = base();
    const r = applyDecision(db, "m-1", "company-01", { scores: allScores(db), continue: false, feedback: allFeedback(db) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.decisions).toEqual([{ meetingId: "m-1", side: "company", continue: false, feedback: allFeedback(db) }]);
    expect(r.value.scores.filter((s) => s.stage === "conversation" && s.value === 7)).toHaveLength(coreIds(db).length);
  });
  test("applyDecision_continue_writesDecisionWithoutFeedback", () => {
    const db = base();
    const r = applyDecision(db, "m-1", "company-01", { scores: allScores(db), continue: true, feedback: {} });
    expect(r.ok && r.value.decisions).toEqual([{ meetingId: "m-1", side: "company", continue: true, feedback: undefined }]);
  });
  test.each([undefined, null, "x", { scores: null, continue: true, feedback: {} }, { scores: {}, continue: true }, { scores: { a: 11 }, continue: true, feedback: {} }])(
    "applyDecision_malformedInput_refusedWithoutThrowing_%#",
    (raw) => {
      expect(applyDecision(base(), "m-1", "company-01", raw)).toEqual({ ok: false, error: "invalid-input" });
    },
  );
});

describe("ShareDetailsSchema", () => {
  test("ShareDetailsSchema_nonStringOrBlank_fails", () => {
    expect(ShareDetailsSchema.safeParse({ contactPerson: 1, nextStep: "a", timeline: "b" }).success).toBe(false);
    expect(ShareDetailsSchema.safeParse({ contactPerson: "  ", nextStep: "a", timeline: "b" }).success).toBe(false);
    expect(ShareDetailsSchema.safeParse(undefined).success).toBe(false);
  });
  test("ShareDetailsSchema_validTrimmed_passes", () => {
    const r = ShareDetailsSchema.safeParse({ contactPerson: " P ", nextStep: "a", timeline: "b" });
    expect(r.success && r.data.contactPerson).toBe("P");
  });
});
