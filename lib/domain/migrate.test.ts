import { describe, expect, test } from "vitest";
import { makeDb } from "./fixtures";
import { answersFromAcceptedLinks } from "./migrate";

const A = "talent-017";
const base = () => makeDb({ entries: [], answers: [] });

describe("answersFromAcceptedLinks", () => {
  test("answersFromAcceptedLinks_acceptedCoreLink_createsEntryAndAnswer", () => {
    const db = base();
    const out = answersFromAcceptedLinks({
      ...db,
      links: [{ id: "l", storyId: "story-017-a", requirementId: "req-01-1", origin: "applicant", status: "accepted" }],
    });
    expect(out.entries).toEqual([
      { id: "entry-1", applicantId: A, body: "Body of story-017-a", sourceStoryId: "story-017-a" },
    ]);
    expect(out.answers).toEqual([{ applicantId: A, requirementId: "req-01-1", entryId: "entry-1" }]);
  });
  test("answersFromAcceptedLinks_nonCoreAccepted_entryButNoAnswer", () => {
    const db = base();
    const out = answersFromAcceptedLinks({
      ...db,
      links: [{ id: "l", storyId: "story-017-a", requirementId: "req-01-6", origin: "applicant", status: "accepted" }],
    });
    expect(out.entries).toHaveLength(1);
    expect(out.answers).toEqual([]);
  });
  test("answersFromAcceptedLinks_twoStoriesSameRequirement_firstWins", () => {
    const db = base();
    const mk = (id: string, storyId: string) => ({ id, storyId, requirementId: "req-01-1", origin: "applicant" as const, status: "accepted" as const });
    const out = answersFromAcceptedLinks({ ...db, links: [mk("l1", "story-017-a"), mk("l2", "story-017-b")] });
    expect(out.entries.map((e) => e.id)).toEqual(["entry-1", "entry-2"]);
    expect(out.answers).toEqual([{ applicantId: A, requirementId: "req-01-1", entryId: "entry-1" }]);
  });
  test("answersFromAcceptedLinks_labelledStory_copiesLabel", () => {
    const db = base();
    const out = answersFromAcceptedLinks({
      ...db,
      stories: db.stories.map((s) => (s.id === "story-017-a" ? { ...s, languageLabel: "language edited" as const } : s)),
      links: [{ id: "l", storyId: "story-017-a", requirementId: "req-01-1", origin: "applicant", status: "accepted" }],
    });
    expect(out.entries[0].languageLabel).toBe("language edited");
  });
  test("answersFromAcceptedLinks_noAcceptedLinks_returnsNoEntries", () => {
    const db = base();
    const out = answersFromAcceptedLinks({ ...db, links: db.links.map((l) => ({ ...l, status: "pending" as const })) });
    expect(out.entries).toEqual([]);
  });
});
