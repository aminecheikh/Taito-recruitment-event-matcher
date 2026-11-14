import { describe, expect, test } from "vitest";
import { buildCard, coverage, filterByCoverage, visibleApplicantName } from "./cards";
import { makeDb } from "./fixtures";
import { acceptMeeting, requestMeeting } from "./meetings";
import type { Db } from "./types";

function booked(): Db {
  const r = requestMeeting(makeDb(), "event-01", "company-01", "talent-017");
  if (!r.ok) throw new Error(r.error);
  const a = acceptMeeting(r.value, r.value.meetings[0].id);
  if (!a.ok) throw new Error(a.error);
  return a.value;
}

describe("cards", () => {
  test("buildCard_beforeBooking_hasNoNameOrContact", () => {
    const card = buildCard(makeDb(), "company-01", "talent-017");
    expect(card.label).toBe("Applicant 017");
    expect(JSON.stringify(card)).not.toContain("Demo Person 017");
    expect(JSON.stringify(card)).not.toContain("talent-017@example.org");
  });
  test("buildCard_afterBooking_labelIsName", () =>
    expect(buildCard(booked(), "company-01", "talent-017").label).toBe("Demo Person 017"));
  test("visibleApplicantName_requestedOnly_staysPseudonym", () => {
    const r = requestMeeting(makeDb(), "event-01", "company-01", "talent-017");
    expect(r.ok && visibleApplicantName(r.value, "company-01", "talent-017")).toBe("Applicant 017");
  });
  test("visibleApplicantName_bookedWithOtherCompany_staysPseudonym", () =>
    expect(visibleApplicantName(booked(), "company-02", "talent-017")).toBe("Applicant 017"));
  test("buildCard_slotsFollowCoreRankWithAcceptedExamples", () => {
    const card = buildCard(makeDb(), "company-01", "talent-017");
    expect(card.slots.map((s) => s.requirement.id)).toEqual(["req-01-1", "req-01-2", "req-01-3", "req-01-4"]);
    expect(card.slots[1].examples).toEqual([
      { story: { id: "story-017-a", title: "Story story-017-a", body: "Body of story-017-a", languageLabel: undefined }, origin: "applicant" },
    ]);
  });
  test("buildCard_noAcceptedExample_slotEmpty", () =>
    expect(buildCard(makeDb(), "company-01", "talent-017").slots[3].examples).toEqual([]));
  test("coverage_pendingAndRejectedLinks_dontCount", () =>
    expect(coverage(makeDb(), "company-01", "talent-017")).toEqual({ covered: 1, total: 4 }));
  test("coverage_demotedRequirement_ignoredAndTotalShrinks", () => {
    const db = makeDb();
    const withExtra: Db = {
      ...db,
      links: [...db.links, { id: "x", storyId: "story-017-a", requirementId: "req-01-1", origin: "applicant", status: "accepted" }],
    };
    expect(coverage(withExtra, "company-01", "talent-017")).toEqual({ covered: 2, total: 4 });
    const demoted: Db = {
      ...withExtra,
      requirements: withExtra.requirements.map((r) => (r.id === "req-01-2" ? { ...r, isCore: false } : r)),
    };
    expect(coverage(demoted, "company-01", "talent-017")).toEqual({ covered: 1, total: 3 });
    expect(buildCard(demoted, "company-01", "talent-017").slots).toHaveLength(3);
  });
  test("filterByCoverage_threshold_keepsInputOrder", () => {
    const db = makeDb();
    expect(filterByCoverage(db, "company-01", ["talent-020", "talent-017"], 2)).toEqual(["talent-020"]);
    expect(filterByCoverage(db, "company-01", ["talent-020", "talent-017"], 1)).toEqual(["talent-020", "talent-017"]);
  });
});
