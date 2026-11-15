import { describe, expect, test } from "vitest";
import { makeDb } from "./fixtures";
import { coreRequirements, setRequirements, validateCore } from "./requirements";
import type { Requirement } from "./types";

const req = (n: number, isCore: boolean, rank = n): Requirement => ({
  id: `r${n}`, companyId: "company-01", text: `t${n}`, inPractice: `p${n}`, rank, isCore,
});
const many = (core: number) => Array.from({ length: 6 }, (_, i) => req(i + 1, i < core));

describe("requirements", () => {
  test("validateCore_sixCore_rejectsTooMany", () =>
    expect(validateCore(Array.from({ length: 6 }, (_, i) => req(i + 1, true)))).toEqual({ ok: false, error: "too-many-core" }));
  test("validateCore_oneCore_accepts", () => expect(validateCore(many(1)).ok).toBe(true));
  test("validateCore_fiveCore_accepts", () => expect(validateCore(many(5)).ok).toBe(true));
  test("validateCore_noCore_rejects", () =>
    expect(validateCore(many(0))).toEqual({ ok: false, error: "no-core" }));
  test("validateCore_duplicateRank_rejects", () =>
    expect(validateCore([req(1, true, 1), req(2, true, 1)])).toEqual({ ok: false, error: "duplicate-rank" }));
  test("setRequirements_valid_replacesOnlyThatCompany", () => {
    const db = makeDb({ requirements: [...makeDb().requirements, { ...req(9, true), id: "other", companyId: "company-02" }] });
    const snapshot = JSON.stringify(db);
    const r = setRequirements(db, "company-01", many(2));
    expect(r.ok && r.value.requirements.filter((x) => x.companyId === "company-01")).toHaveLength(6);
    expect(r.ok && r.value.requirements.some((x) => x.id === "other")).toBe(true);
    expect(JSON.stringify(db)).toBe(snapshot);
  });
  test("setRequirements_deletedRequirement_dropsItsLinksAndScoresOnly", () => {
    const base = makeDb();
    const score = (requirementId: string) => ({
      companyId: "company-01", applicantId: "talent-017", requirementId, stage: "card" as const, value: 7,
    });
    const db = makeDb({ scores: [score("req-01-1"), score("req-01-2")] });
    const kept = base.requirements.filter((r) => r.companyId === "company-01" && r.id !== "req-01-2");
    const r = setRequirements(db, "company-01", kept);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.requirements.some((x) => x.id === "req-01-2")).toBe(false);
    expect(r.value.links.some((l) => l.requirementId === "req-01-2")).toBe(false);
    expect(r.value.links.filter((l) => l.requirementId !== "req-01-2")).toEqual(
      db.links.filter((l) => l.requirementId !== "req-01-2"),
    );
    expect(r.value.scores.map((s) => s.requirementId)).toEqual(["req-01-1"]);
  });
  test("setRequirements_invalid_returnsError", () =>
    expect(setRequirements(makeDb(), "company-01", many(0))).toEqual({ ok: false, error: "no-core" }));
  test("setRequirements_wrongCompany_rejects", () =>
    expect(setRequirements(makeDb(), "company-02", many(2))).toEqual({ ok: false, error: "company-mismatch" }));
  test("coreRequirements_unsorted_returnsCoreByRank", () => {
    const db = makeDb({ requirements: [req(3, true), req(1, true), req(2, false)] });
    expect(coreRequirements(db, "company-01").map((x) => x.id)).toEqual(["r1", "r3"]);
  });
  test("setRequirements_deletedRequirement_dropsItsAnswersButKeepsEntries", () => {
    const answer = (requirementId: string) => ({ applicantId: "talent-017", requirementId, entryId: "entry-1" });
    const db = makeDb({
      entries: [{ id: "entry-1", applicantId: "talent-017", body: "x" }],
      answers: [answer("req-01-1"), answer("req-01-2")],
    });
    const kept = db.requirements.filter((r) => r.id !== "req-01-2");
    const r = setRequirements(db, "company-01", kept);
    expect(r.ok && r.value.answers).toEqual([answer("req-01-1")]);
    expect(r.ok && r.value.entries).toHaveLength(1);
  });
});
