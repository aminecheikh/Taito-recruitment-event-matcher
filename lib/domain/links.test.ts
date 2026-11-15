import { describe, expect, test } from "vitest";
import { makeDb } from "./fixtures";
import { addSuggestions, rejectLink } from "./links";
import type { Db, Link } from "./types";

const find = (db: Db, storyId: string, requirementId: string): Link | undefined =>
  db.links.find((l) => l.storyId === storyId && l.requirementId === requirementId);

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

describe("reject", () => {
  test("rejectLink_pending_becomesRejected", () => {
    const r = rejectLink(makeDb(), "link-017-2");
    expect(r.ok && r.value.links.find((l) => l.id === "link-017-2")?.status).toBe("rejected");
  });
  test("rejectLink_unknownLink_notFound", () => {
    expect(rejectLink(makeDb(), "nope")).toEqual({ ok: false, error: "not-found" });
  });
});
