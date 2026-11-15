import { describe, expect, test } from "vitest";
import { makeDb } from "./fixtures";
import { MIN_GROUP_SIZE, demandReport, poolSummary, processCheck } from "./insights";
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

describe("demandReport", () => {
  test("demandReport_thinnestFirst", () => {
    const base = makeDb();
    const db = makeDb({
      answers: [...base.answers, { applicantId: "talent-017", requirementId: "req-01-4", entryId: "entry-story-017-a" }],
    });
    const rows = demandReport(db, "event-01");
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.withExample)).toEqual([1, 1, 1, 2]);
    expect(rows[3]).toMatchObject({ companyName: "Demo Company", requirementText: "Requirement 4", rank: 4, registered: 2 });
  });
  test("demandReport_noCore_noRows", () => {
    const base = makeDb();
    const db = makeDb({ requirements: base.requirements.map((r) => ({ ...r, isCore: false })) });
    expect(demandReport(db, "event-01")).toEqual([]);
  });
  test("demandReport_unregisteredApplicant_notCounted", () => {
    const db = makeDb({ applicantEvents: [{ applicantId: "talent-017", eventId: "event-01" }] });
    const rows = demandReport(db, "event-01");
    expect(rows.every((r) => r.registered === 1)).toBe(true);
    expect(rows.reduce((sum, r) => sum + r.withExample, 0)).toBe(1);
  });
});

function crowdDb(labelled: number, plain: number, meetingsLabelled: number, meetingsPlain: number): Db {
  const base = makeDb();
  const ids = Array.from({ length: labelled + plain }, (_, i) => `talent-1${String(i).padStart(2, "0")}`);
  const labelledIds = ids.slice(0, labelled);
  return makeDb({
    signals: ids.map((applicantId) => ({ eventId: "event-01", applicantId, companyId: "company-01" })),
    entries: [
      ...base.entries,
      ...ids.map((id) => ({
        id: `entry-${id}`,
        applicantId: id,
        body: "b",
        sourceStoryId: "s",
        ...(labelledIds.includes(id) ? { languageLabel: "language edited" as const } : {}),
      })),
    ],
    answers: [...base.answers, ...ids.map((id) => ({ applicantId: id, requirementId: "req-01-1", entryId: `entry-${id}` }))],
    meetings: [...ids.slice(0, meetingsLabelled), ...ids.slice(labelled, labelled + meetingsPlain)].map((applicantId) => ({
      id: `m-${applicantId}`,
      eventId: "event-01",
      companyId: "company-01",
      applicantId,
      status: "requested" as const,
    })),
  });
}

describe("processCheck", () => {
  test("processCheck_groupsByLanguageLabel", () => {
    const result = processCheck(crowdDb(6, 7, 2, 5), "event-01");
    const byLabel = Object.fromEntries(result.groups.map((g) => [g.label, g]));
    expect(byLabel["Used AI language help"]).toMatchObject({ signals: 6, meetingsRequested: 2 });
    expect(byLabel["Own wording only"]).toMatchObject({ signals: 7, meetingsRequested: 5 });
    expect(result.comparable).toBe(true);
  });
  test("processCheck_underFive_notComparable", () => {
    const result = processCheck(crowdDb(MIN_GROUP_SIZE - 1, 6, 1, 1), "event-01");
    expect(result.comparable).toBe(false);
  });
  test("processCheck_labelOnNonCoreAnswer_notCounted", () => {
    const base = makeDb();
    const db = makeDb({
      entries: base.entries.map((e) => (e.applicantId === "talent-017" ? { ...e, languageLabel: "translated from Arabic" as const } : e)),
      answers: base.answers.map((a) => (a.applicantId === "talent-017" ? { ...a, requirementId: "req-01-6" } : a)),
    });
    const used = processCheck(db, "event-01").groups.find((g) => g.label === "Used AI language help");
    expect(used?.signals).toBe(0);
  });
});
