import { describe, expect, test } from "vitest";
import { makeDb } from "./fixtures";
import { setScore, totalScore } from "./scores";
import type { Db, Score } from "./types";

const score = (requirementId: string, value: number, stage: Score["stage"] = "card"): Score => ({
  companyId: "company-01", applicantId: "talent-017", requirementId, stage, value,
});
function apply(db: Db, scores: Score[]): Db {
  return scores.reduce((acc, s) => {
    const r = setScore(acc, s);
    if (!r.ok) throw new Error(r.error);
    return r.value;
  }, db);
}

describe("scores", () => {
  test("totalScore_partlyScored_isUndefined", () =>
    expect(totalScore(apply(makeDb(), [score("req-01-1", 8)]), "company-01", "talent-017", "card")).toBeUndefined());
  test("totalScore_allCoreScored_sumsOutOfTenTimesCore", () => {
    const full = apply(makeDb(), [score("req-01-1", 8), score("req-01-2", 7), score("req-01-3", 6), score("req-01-4", 8)]);
    expect(totalScore(full, "company-01", "talent-017", "card")).toEqual({ total: 29, max: 40 });
    expect(totalScore(full, "company-01", "talent-017", "conversation")).toBeUndefined();
  });
  test("setScore_sameKey_upsertsWithoutMutatingInput", () => {
    const db = apply(makeDb(), [score("req-01-1", 3)]);
    const before = JSON.stringify(db);
    const r = setScore(db, score("req-01-1", 9));
    expect(r.ok && r.value.scores).toHaveLength(1);
    expect(r.ok && r.value.scores[0].value).toBe(9);
    expect(JSON.stringify(db)).toBe(before);
  });
  test("setScore_differentStage_isSeparateRow", () =>
    expect(apply(makeDb(), [score("req-01-1", 3), score("req-01-1", 4, "conversation")]).scores).toHaveLength(2));
  test("setScore_nonCoreRequirement_rejects", () =>
    expect(setScore(makeDb(), score("req-01-5", 5))).toEqual({ ok: false, error: "not-core" }));
  test.each([-1, 11, 5.5])("setScore_value_%s_rejects", (v) =>
    expect(setScore(makeDb(), score("req-01-1", v)).ok).toBe(false));
  test("totalScore_scoreForDemotedRequirement_ignored", () => {
    const full = apply(makeDb(), [score("req-01-1", 8), score("req-01-2", 7), score("req-01-3", 6), score("req-01-4", 8)]);
    const demoted: Db = { ...full, requirements: full.requirements.map((r) => (r.id === "req-01-4" ? { ...r, isCore: false } : r)) };
    expect(totalScore(demoted, "company-01", "talent-017", "card")).toEqual({ total: 21, max: 30 });
  });
});
