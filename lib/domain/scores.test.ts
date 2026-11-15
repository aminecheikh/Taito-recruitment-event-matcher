import { describe, expect, test } from "vitest";
import { makeDb } from "./fixtures";
import { rankWeights, setScore, shortlist, weightedFromValues, weightedScore } from "./scores";
import type { Db, Score } from "./types";

describe("weightedFromValues", () => {
  test("weightedFromValues_onlyFirstFull_is40", () => {
    expect(weightedFromValues([10, 0, 0, 0])).toBe(40);
  });
  test("weightedFromValues_allButFirstFull_is60", () => {
    expect(weightedFromValues([0, 10, 10, 10])).toBe(60);
  });
  test("weightedFromValues_allEight_is80", () => {
    expect(weightedFromValues([8, 8, 8, 8])).toBe(80);
  });
  test("weightedFromValues_oneMissing_isUndefined", () => {
    expect(weightedFromValues([8, undefined, 8, 8])).toBeUndefined();
  });
  test("weightedFromValues_empty_isUndefined", () => {
    expect(weightedFromValues([])).toBeUndefined();
  });
});

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
});

const scoreFor = (applicantId: string, requirementId: string, value: number): Score => ({
  companyId: "company-01", applicantId, requirementId, stage: "card", value,
});
const scoreAll = (db: Db, values: number[], applicantId = "talent-017") =>
  apply(db, values.map((v, i) => scoreFor(applicantId, `req-01-${i + 1}`, v)));

describe("rankWeights", () => {
  test("rankWeights_fourCore_givesFourThreeTwoOne", () =>
    expect([...rankWeights(makeDb(), "company-01")]).toEqual([["req-01-1", 4], ["req-01-2", 3], ["req-01-3", 2], ["req-01-4", 1]]));
  test("rankWeights_nonContiguousRanks_weighsByPosition", () => {
    const ranks: Record<string, [number, boolean]> = { "req-01-1": [1, true], "req-01-2": [2, true], "req-01-3": [3, false], "req-01-4": [4, true], "req-01-5": [5, false], "req-01-6": [6, true] };
    const db = makeDb();
    const spread: Db = { ...db, requirements: db.requirements.map((r) => ({ ...r, rank: ranks[r.id][0], isCore: ranks[r.id][1] })) };
    expect([...rankWeights(spread, "company-01")]).toEqual([["req-01-1", 4], ["req-01-2", 3], ["req-01-4", 2], ["req-01-6", 1]]);
  });
});

describe("weightedScore", () => {
  test("weightedScore_onlyTopRequirementFull_is40", () =>
    expect(weightedScore(scoreAll(makeDb(), [10, 0, 0, 0]), "company-01", "talent-017", "card")).toBe(40));
  test("weightedScore_strongOnAllButFirst_is60", () =>
    expect(weightedScore(scoreAll(makeDb(), [0, 10, 10, 10]), "company-01", "talent-017", "card")).toBe(60));
  test("weightedScore_allTen_is100", () =>
    expect(weightedScore(scoreAll(makeDb(), [10, 10, 10, 10]), "company-01", "talent-017", "card")).toBe(100));
  test("weightedScore_oneMissing_isUndefined", () =>
    expect(weightedScore(scoreAll(makeDb(), [10, 10, 10]), "company-01", "talent-017", "card")).toBeUndefined());
  test("weightedScore_noCore_isUndefined", () => {
    const db = makeDb();
    const none: Db = { ...db, requirements: db.requirements.map((r) => ({ ...r, isCore: false })) };
    expect(weightedScore(none, "company-01", "talent-017", "card")).toBeUndefined();
  });
});

describe("shortlist", () => {
  const ids = ["talent-017", "talent-020"];
  test("shortlist_minWeighted_hidesLowScoredButKeepsNotScored", () => {
    const db = scoreAll(makeDb(), [1, 1, 1, 1], "talent-017");
    const result = shortlist(db, "company-01", ids, { minCovered: 0, minWeighted: 60 });
    expect(result.scored).toEqual([]);
    expect(result.notScored.map((r) => r.applicantId)).toEqual(["talent-020"]);
    const all = shortlist(db, "company-01", ids, { minCovered: 0 });
    expect(all.scored.map((r) => r.applicantId)).toEqual(["talent-017"]);
    expect(all.scored[0].weighted).toBe(10);
  });
  test("shortlist_coverageFilter_appliesToBothGroups", () => {
    const db = scoreAll(makeDb(), [9, 9, 9, 9], "talent-017");
    const result = shortlist(db, "company-01", ids, { minCovered: 3 });
    expect(result.scored).toEqual([]);
    expect(result.notScored.map((r) => r.applicantId)).toEqual(["talent-020"]);
  });
  test("shortlist_scored_sortsByWeightedDescending", () => {
    const db = scoreAll(scoreAll(makeDb(), [2, 2, 2, 2], "talent-017"), [8, 8, 8, 8], "talent-020");
    expect(shortlist(db, "company-01", ids, { minCovered: 0 }).scored.map((r) => r.applicantId)).toEqual(["talent-020", "talent-017"]);
  });
});
