import { describe, expect, test } from "vitest";
import { makeDb } from "@/lib/domain/fixtures";
import { findOwnSuggestInput } from "./suggestInput";

describe("findOwnSuggestInput", () => {
  const db = makeDb();

  test("findOwnSuggestInput_ownStory_returnsStoryAndCoreRequirements", () => {
    const input = findOwnSuggestInput(db, "story-017-a", "talent-017", "event-01");
    expect(input?.story.id).toBe("story-017-a");
    expect(input?.requirements.map((r) => r.id)).toEqual(["req-01-1", "req-01-2", "req-01-3", "req-01-4"]);
  });

  test("findOwnSuggestInput_otherApplicantsStory_returnsNull", () => {
    expect(findOwnSuggestInput(db, "story-020-a", "talent-017", "event-01")).toBeNull();
  });

  test("findOwnSuggestInput_unknownStory_returnsNull", () => {
    expect(findOwnSuggestInput(db, "nope", "talent-017", "event-01")).toBeNull();
  });
});
