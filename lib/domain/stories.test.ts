import { describe, expect, test } from "vitest";
import { makeDb } from "./fixtures";
import { addStory, updateStory } from "./stories";

describe("stories", () => {
  test("addStory_emptyTitle_returnsEmptyTitle", () =>
    expect(addStory(makeDb(), "talent-017", { title: "  ", body: "text" })).toEqual({ ok: false, error: "empty-title" }));
  test("addStory_emptyBody_returnsEmptyBody", () =>
    expect(addStory(makeDb(), "talent-017", { title: "Title", body: " \n" })).toEqual({ ok: false, error: "empty-body" }));
  test("addStory_valid_appendsStoryWithFreshIdAndLeavesInputUntouched", () => {
    const db = makeDb();
    const snapshot = JSON.stringify(db);
    const r = addStory(db, "talent-017", { title: " Mine ", body: " My words " });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const added = r.value.stories.at(-1);
    expect(added).toEqual({ id: "story-5", applicantId: "talent-017", title: "Mine", body: "My words" });
    expect(new Set(r.value.stories.map((s) => s.id)).size).toBe(r.value.stories.length);
    expect(JSON.stringify(db)).toBe(snapshot);
  });
  test("addStory_idTaken_picksNextFreeId", () => {
    const db = makeDb();
    const first = addStory(db, "talent-017", { title: "A", body: "b" });
    if (!first.ok) throw new Error("setup");
    const withoutFirst = { ...first.value, stories: first.value.stories.filter((s) => s.id !== "story-1") };
    const second = addStory(withoutFirst, "talent-017", { title: "C", body: "d" });
    expect(second.ok && second.value.stories.at(-1)?.id).toBe("story-6");
  });
  test("updateStory_unknownId_returnsNotFound", () =>
    expect(updateStory(makeDb(), "nope", { body: "x" })).toEqual({ ok: false, error: "not-found" }));
  test("updateStory_emptyBody_returnsEmptyBody", () =>
    expect(updateStory(makeDb(), "story-017-a", { body: "" })).toEqual({ ok: false, error: "empty-body" }));
  test("updateStory_emptyTitle_returnsEmptyTitle", () =>
    expect(updateStory(makeDb(), "story-017-a", { title: " " })).toEqual({ ok: false, error: "empty-title" }));
  test("updateStory_bodyOnly_keepsLinksAndExistingLanguageLabel", () => {
    const base = makeDb();
    const db = {
      ...base,
      stories: base.stories.map((s) => (s.id === "story-017-a" ? { ...s, languageLabel: "language edited" as const } : s)),
    };
    const r = updateStory(db, "story-017-a", { body: "new body" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.links).toEqual(db.links);
    const story = r.value.stories.find((s) => s.id === "story-017-a");
    expect(story).toMatchObject({ body: "new body", languageLabel: "language edited", title: "Story story-017-a" });
    expect(r.value.stories.find((s) => s.id === "story-017-b")).toEqual(db.stories[1]);
  });
  test("updateStory_withLabel_setsLabel", () => {
    const r = updateStory(makeDb(), "story-017-a", { body: "x", languageLabel: "translated from Ukrainian" });
    expect(r.ok && r.value.stories[0].languageLabel).toBe("translated from Ukrainian");
  });
});
