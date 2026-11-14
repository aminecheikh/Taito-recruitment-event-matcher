import { describe, expect, test } from "vitest";
import { makeDb } from "./fixtures";
import { acceptLink, addSuggestions, linkManually, moveLink, rejectLink } from "./links";
import type { Db, Link } from "./types";

const find = (db: Db, storyId: string, requirementId: string): Link | undefined =>
  db.links.find((l) => l.storyId === storyId && l.requirementId === requirementId);

const twoCompanies = (): Db => {
  const db = makeDb();
  return {
    ...db,
    companies: [...db.companies, { id: "company-02", name: "Other", sector: "x", sizeRange: "1-10" }],
    requirements: [
      ...db.requirements,
      { id: "req-02-1", companyId: "company-02", text: "t", inPractice: "p", rank: 1, isCore: true },
    ],
  };
};

describe("addSuggestions", () => {
  test("addSuggestions_newPair_addsPendingAiLinkWithReason", () => {
    const db = addSuggestions(makeDb(), "story-017-a", [{ requirementId: "req-01-1", reason: "because" }]);
    expect(find(db, "story-017-a", "req-01-1")).toMatchObject({ origin: "ai-suggested", status: "pending", aiReason: "because" });
  });
  test("addSuggestions_duplicatePair_skipped", () => {
    const once = addSuggestions(makeDb(), "story-017-a", [{ requirementId: "req-01-1", reason: "a" }]);
    const twice = addSuggestions(once, "story-017-a", [{ requirementId: "req-01-1", reason: "b" }, { requirementId: "req-01-2", reason: "c" }]);
    expect(twice.links.filter((l) => l.storyId === "story-017-a" && l.requirementId === "req-01-1")).toHaveLength(1);
    expect(twice.links.filter((l) => l.storyId === "story-017-a" && l.requirementId === "req-01-2")).toHaveLength(1);
  });
  test("addSuggestions_rejectedPair_staysRejected", () => {
    const db = addSuggestions(makeDb(), "story-017-b", [{ requirementId: "req-01-4", reason: "again" }]);
    expect(find(db, "story-017-b", "req-01-4")?.status).toBe("rejected");
    expect(db.links).toHaveLength(makeDb().links.length);
  });
  test("addSuggestions_newLinks_haveUniqueIds", () => {
    const db = addSuggestions(makeDb(), "story-017-a", [{ requirementId: "req-01-1", reason: "a" }, { requirementId: "req-01-3", reason: "b" }]);
    expect(new Set(db.links.map((l) => l.id)).size).toBe(db.links.length);
  });
});

describe("accept, reject", () => {
  test("acceptLink_pending_becomesAcceptedKeepingOrigin", () => {
    const r = acceptLink(makeDb(), "link-017-2");
    expect(r.ok && r.value.links.find((l) => l.id === "link-017-2")?.status).toBe("accepted");
  });
  test("rejectLink_pending_becomesRejected", () => {
    const r = rejectLink(makeDb(), "link-017-2");
    expect(r.ok && r.value.links.find((l) => l.id === "link-017-2")?.status).toBe("rejected");
  });
  test("acceptLink_unknownLink_notFound", () => {
    expect(acceptLink(makeDb(), "nope")).toEqual({ ok: false, error: "not-found" });
    expect(rejectLink(makeDb(), "nope")).toEqual({ ok: false, error: "not-found" });
  });
});

describe("moveLink", () => {
  test("moveLink_sameCompany_acceptedApplicantOrigin", () => {
    const r = moveLink(makeDb(), "link-017-2", "req-01-1");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(find(r.value, "story-017-b", "req-01-3")).toBeUndefined();
    expect(find(r.value, "story-017-b", "req-01-1")).toMatchObject({ status: "accepted", origin: "applicant" });
  });
  test("moveLink_otherCompanyRequirement_refused", () => {
    expect(moveLink(twoCompanies(), "link-017-2", "req-02-1")).toEqual({ ok: false, error: "other-company" });
  });
  test("moveLink_unknownTarget_notFound", () => {
    expect(moveLink(makeDb(), "link-017-2", "zzz")).toEqual({ ok: false, error: "not-found" });
  });
  test("moveLink_targetAlreadyLinked_mergesIntoOneAcceptedLink", () => {
    const r = moveLink(makeDb(), "link-017-2", "req-01-4");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.links.filter((l) => l.storyId === "story-017-b" && l.requirementId === "req-01-4")).toHaveLength(1);
    expect(find(r.value, "story-017-b", "req-01-4")?.status).toBe("accepted");
  });
});

describe("linkManually", () => {
  test("linkManually_newPair_acceptedApplicantOrigin", () => {
    const r = linkManually(makeDb(), "story-017-a", "req-01-1");
    expect(r.ok && find(r.value, "story-017-a", "req-01-1")).toMatchObject({ origin: "applicant", status: "accepted" });
  });
  test("linkManually_existingPendingPair_becomesAcceptedApplicant", () => {
    const r = linkManually(makeDb(), "story-017-b", "req-01-3");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.links.filter((l) => l.storyId === "story-017-b" && l.requirementId === "req-01-3")).toHaveLength(1);
    expect(find(r.value, "story-017-b", "req-01-3")).toMatchObject({ origin: "applicant", status: "accepted" });
  });
  test("linkManually_unknownStory_notFound", () => {
    expect(linkManually(makeDb(), "nope", "req-01-1")).toEqual({ ok: false, error: "not-found" });
  });
});
