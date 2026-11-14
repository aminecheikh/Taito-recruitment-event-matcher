import { describe, expect, test } from "vitest";
import { makeDb } from "./fixtures";
import { needsHelp } from "./readiness";

describe("needsHelp", () => {
  test("needsHelp_everyoneReady_returnsEmpty", () => {
    expect(needsHelp(makeDb())).toEqual([]);
  });
  test("needsHelp_noStoriesOrNoAcceptedLinks_listsAlphabeticallyByPseudonym", () => {
    const base = makeDb();
    const db = makeDb({
      applicants: [
        { id: "talent-030", pseudonym: "Zed", displayName: "d", contact: { email: "e" } },
        ...base.applicants,
        { id: "talent-031", pseudonym: "Amy", displayName: "d", contact: { email: "e" } },
      ],
      stories: [...base.stories, { id: "s-030", applicantId: "talent-030", title: "t", body: "b" }],
      links: base.links.filter((l) => l.storyId !== "story-020-a" && l.storyId !== "story-020-b"),
    });
    expect(needsHelp(db)).toEqual([
      { applicantId: "talent-031", pseudonym: "Amy", stories: 0, acceptedLinks: 0 },
      { applicantId: "talent-020", pseudonym: "Applicant 020", stories: 2, acceptedLinks: 0 },
      { applicantId: "talent-030", pseudonym: "Zed", stories: 1, acceptedLinks: 0 },
    ]);
  });
  test("needsHelp_pendingAndRejectedOnly_countsAsNoAcceptedLinks", () => {
    const base = makeDb();
    const db = makeDb({ links: base.links.filter((l) => l.id === "link-017-2" || l.id === "link-017-3" || l.id.startsWith("link-020")) });
    expect(needsHelp(db)).toEqual([{ applicantId: "talent-017", pseudonym: "Applicant 017", stories: 2, acceptedLinks: 0 }]);
  });
  test("needsHelp_doesNotMutateInput", () => {
    const db = makeDb({ links: [] });
    const copy = structuredClone(db);
    needsHelp(db);
    expect(db).toEqual(copy);
  });
});
