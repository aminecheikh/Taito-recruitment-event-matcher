import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { makeDb } from "@/lib/domain/fixtures";
import { readDb } from "@/lib/store/db";

const session = vi.hoisted(() => ({ applicantId: "talent-017" }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/session", () => ({ getSession: async () => ({ applicantId: session.applicantId }) }));

import { createStory, saveStory } from "./stories";

const NOT_FOUND = { ok: false, error: "That story was not found." };

beforeEach(() => {
  const dir = mkdtempSync(join(tmpdir(), "stories-action-"));
  process.env.DB_PATH = join(dir, "db.json");
  writeFileSync(process.env.DB_PATH, JSON.stringify(makeDb()));
  session.applicantId = "talent-017";
});

const body = async (id: string) => (await readDb()).stories.find((s) => s.id === id);

describe("story actions", () => {
  test("saveStory_ownStory_savesBody", async () => {
    expect(await saveStory("story-017-a", { body: "new words" })).toEqual({ ok: true });
    expect((await body("story-017-a"))?.body).toBe("new words");
  });
  test("saveStory_otherApplicantsStory_notFoundAndUnchanged", async () => {
    expect(await saveStory("story-020-a", { body: "hacked" })).toEqual(NOT_FOUND);
    expect((await body("story-020-a"))?.body).toBe("Body of story-020-a");
  });
  test("saveStory_unknownSessionApplicant_refused", async () => {
    session.applicantId = "talent-999";
    expect(await saveStory("story-017-a", { body: "x" })).toEqual({ ok: false, error: "Pick an applicant in the top bar" });
    expect((await body("story-017-a"))?.body).toBe("Body of story-017-a");
  });
  test("saveStory_bodyOverLengthBound_refused", async () => {
    const res = await saveStory("story-017-a", { body: "a".repeat(10_001) });
    expect(res.ok).toBe(false);
    expect((await body("story-017-a"))?.body).toBe("Body of story-017-a");
  });
  test("saveStory_invalidLabel_refused", async () => {
    expect((await saveStory("story-017-a", { body: "x", languageLabel: "made by a human, honest" })).ok).toBe(false);
    expect((await body("story-017-a"))?.languageLabel).toBeUndefined();
  });
  test("saveStory_validLabel_saved", async () => {
    expect(await saveStory("story-017-a", { body: "x", languageLabel: "translated from Ukrainian" })).toEqual({ ok: true });
    expect((await body("story-017-a"))?.languageLabel).toBe("translated from Ukrainian");
  });
  test("createStory_unknownSessionApplicant_refused", async () => {
    session.applicantId = "talent-999";
    expect((await createStory({ title: "t", body: "b" })).ok).toBe(false);
  });
});
