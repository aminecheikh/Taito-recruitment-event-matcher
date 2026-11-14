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

import { rejectSuggestion, saveSuggestions } from "./links";

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
  test("rejectSuggestion_otherApplicantsLink_refused", async () => {
    expect(await rejectSuggestion("link-020-1")).toEqual(NOT_FOUND);
    expect((await link("link-020-1"))?.status).toBe("accepted");
  });
  test("rejectSuggestion_ownLink_rejected", async () => {
    expect(await rejectSuggestion("link-017-2")).toEqual({ ok: true });
    expect((await link("link-017-2"))?.status).toBe("rejected");
  });
});
