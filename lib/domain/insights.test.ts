import { describe, expect, test } from "vitest";
import { makeDb } from "./fixtures";
import { poolSummary } from "./insights";
import type { Db } from "./types";

function fullCoverageDb(): Db {
  const base = makeDb();
  return makeDb({
    answers: [...base.answers, { applicantId: "talent-020", requirementId: "req-01-2", entryId: "entry-story-020-a" }],
  });
}

describe("poolSummary", () => {
  test("poolSummary_countsSignalsAndFullCoverage", () => {
    const summary = poolSummary(fullCoverageDb(), "event-01", "company-01");
    expect(summary).toEqual({ signalled: 2, coverAll: 1, coreCount: 4, openSlots: 8 });
  });
  test("poolSummary_noCore_coverAllZero", () => {
    const base = makeDb();
    const db = makeDb({ requirements: base.requirements.map((r) => ({ ...r, isCore: false })) });
    const summary = poolSummary(db, "event-01", "company-01");
    expect(summary.coreCount).toBe(0);
    expect(summary.coverAll).toBe(0);
    expect(summary.signalled).toBe(2);
  });
  test("poolSummary_otherEventSignals_notCounted", () => {
    const base = makeDb();
    const db = makeDb({ signals: [...base.signals, { eventId: "event-99", applicantId: "talent-017", companyId: "company-01" }] });
    expect(poolSummary(db, "event-01", "company-01").signalled).toBe(2);
  });
});
