import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { makeDb } from "@/lib/domain/fixtures";
import type { Db } from "@/lib/domain/types";
import { readDb } from "@/lib/store/db";

const session = vi.hoisted(() => ({ applicantId: "talent-017" }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/session", () => ({ getSession: async () => ({ applicantId: session.applicantId, eventId: "event-01" }) }));

import { acceptSuggestion, linkMyself, moveSuggestion, rejectSuggestion, saveSuggestions } from "./links";

const NOT_FOUND = { ok: false, error: "That example or requirement was not found." };

function seed(db: Db) {
  const dir = mkdtempSync(join(tmpdir(), "links-action-"));
  process.env.DB_PATH = join(dir, "db.json");
  writeFileSync(process.env.DB_PATH, JSON.stringify(db));
}
const link = async (id: string) => (await readDb()).links.find((l) => l.id === id);

beforeEach(() => {
  seed(makeDb());
  session.applicantId = "talent-017";
});

describe("link actions", () => {
  test("saveSuggestions_ownStoryCoreTarget_storesPendingLink", async () => {
    expect(await saveSuggestions("story-017-a", [{ requirementId: "req-01-1", reason: "why" }])).toEqual({ ok: true, added: 1 });
    expect(await link("link-story-017-a-req-01-1")).toMatchObject({ status: "pending", origin: "ai-suggested", aiReason: "why" });
  });
  test("saveSuggestions_otherApplicantsStory_refusedAndNothingStored", async () => {
    const before = (await readDb()).links.length;
    expect(await saveSuggestions("story-020-a", [{ requirementId: "req-01-1", reason: "why" }])).toEqual(NOT_FOUND);
    expect((await readDb()).links).toHaveLength(before);
  });
  test("saveSuggestions_partiallyInvalidBatch_storesValidDropsInvalid", async () => {
    const before = (await readDb()).links.length;
    const res = await saveSuggestions("story-017-a", [
      { requirementId: "req-01-5", reason: "stale" },
      { requirementId: "req-01-1", reason: "ok" },
    ]);
    expect(res).toEqual({ ok: true, added: 1 });
    expect((await readDb()).links).toHaveLength(before + 1);
    expect(await link("link-story-017-a-req-01-5")).toBeUndefined();
    expect(await link("link-story-017-a-req-01-1")).toBeDefined();
  });
  test("saveSuggestions_allInvalid_okAndNothingStored", async () => {
    const before = (await readDb()).links.length;
    expect(await saveSuggestions("story-017-a", [{ requirementId: "req-01-5", reason: "stale" }])).toEqual({ ok: true, added: 0 });
    expect((await readDb()).links).toHaveLength(before);
  });
  test("saveSuggestions_allDuplicates_okWithZeroAdded", async () => {
    expect(await saveSuggestions("story-017-b", [{ requirementId: "req-01-3", reason: "dup" }])).toEqual({ ok: true, added: 0 });
  });
  test("acceptSuggestion_ownPending_accepted", async () => {
    expect(await acceptSuggestion("link-017-2")).toEqual({ ok: true });
    expect((await link("link-017-2"))?.status).toBe("accepted");
  });
  test("acceptSuggestion_otherApplicantsLink_refusedAndUnchanged", async () => {
    seed(makeDb({ links: [{ id: "x", storyId: "story-020-a", requirementId: "req-01-1", origin: "ai-suggested", status: "pending" }] }));
    expect(await acceptSuggestion("x")).toEqual(NOT_FOUND);
    expect((await link("x"))?.status).toBe("pending");
  });
  test("rejectSuggestion_otherApplicantsLink_refused", async () => {
    expect(await rejectSuggestion("link-020-1")).toEqual(NOT_FOUND);
    expect((await link("link-020-1"))?.status).toBe("accepted");
  });
  test("rejectSuggestion_ownLink_rejected", async () => {
    expect(await rejectSuggestion("link-017-2")).toEqual({ ok: true });
    expect((await link("link-017-2"))?.status).toBe("rejected");
  });
  test("moveSuggestion_sameCompanyCoreTarget_moved", async () => {
    expect(await moveSuggestion("link-017-2", "req-01-1")).toEqual({ ok: true });
    expect(await link("link-017-2")).toBeUndefined();
    expect(await link("link-story-017-b-req-01-1")).toMatchObject({ status: "accepted", origin: "applicant" });
  });
  test("moveSuggestion_nonCoreTarget_refusedAndUnchanged", async () => {
    expect(await moveSuggestion("link-017-2", "req-01-6")).toEqual(NOT_FOUND);
    expect((await link("link-017-2"))?.status).toBe("pending");
  });
  test("moveSuggestion_otherCompanyTarget_refused", async () => {
    const base = makeDb();
    seed({
      ...base,
      companies: [...base.companies, { id: "company-02", name: "Other", sector: "x", sizeRange: "1-10" }],
      companyEvents: [...base.companyEvents, { companyId: "company-02", eventId: "event-01" }],
      requirements: [...base.requirements, { id: "req-02-1", companyId: "company-02", text: "t", inPractice: "p", rank: 1, isCore: true }],
    });
    expect(await moveSuggestion("link-017-2", "req-02-1")).toEqual({ ok: false, error: "You can only move a link to another requirement of the same company." });
    expect((await link("link-017-2"))?.requirementId).toBe("req-01-3");
  });
  test("moveSuggestion_otherApplicantsLink_refused", async () => {
    expect(await moveSuggestion("link-020-1", "req-01-2")).toEqual(NOT_FOUND);
  });
  test("linkMyself_ownStoryCoreTarget_acceptedApplicantLink", async () => {
    expect(await linkMyself("story-017-a", "req-01-1")).toEqual({ ok: true });
    expect(await link("link-story-017-a-req-01-1")).toMatchObject({ status: "accepted", origin: "applicant" });
  });
  test("linkMyself_otherApplicantsStory_refused", async () => {
    expect(await linkMyself("story-020-a", "req-01-2")).toEqual(NOT_FOUND);
  });
  test("linkMyself_nonCoreTarget_refused", async () => {
    expect(await linkMyself("story-017-a", "req-01-5")).toEqual(NOT_FOUND);
  });
  test("linkMyself_unknownSessionApplicant_refused", async () => {
    session.applicantId = "talent-999";
    expect(await linkMyself("story-017-a", "req-01-1")).toEqual({ ok: false, error: "Pick an applicant in the top bar" });
  });
});
