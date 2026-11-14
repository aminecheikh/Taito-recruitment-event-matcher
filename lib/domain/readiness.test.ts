import { describe, expect, test } from "vitest";
import { makeDb } from "./fixtures";
import { needsHelp } from "./readiness";

describe("needsHelp", () => {
  test("needsHelp_everyoneReady_returnsEmpty", () => {
    expect(needsHelp(makeDb())).toEqual([]);
  });
  test("needsHelp_noStoriesOrNoAnswers_listsAlphabeticallyByPseudonym", () => {
    const base = makeDb();
    const db = makeDb({
      applicants: [
        { id: "talent-030", pseudonym: "Zed", displayName: "d", contact: { email: "e" } },
        ...base.applicants,
        { id: "talent-031", pseudonym: "Amy", displayName: "d", contact: { email: "e" } },
      ],
      stories: [...base.stories, { id: "s-030", applicantId: "talent-030", title: "t", body: "b" }],
      answers: base.answers.filter((a) => a.applicantId !== "talent-020"),
    });
    expect(needsHelp(db)).toEqual([
      { applicantId: "talent-031", pseudonym: "Amy", stories: 0, answers: 0 },
      { applicantId: "talent-020", pseudonym: "Applicant 020", stories: 2, answers: 0 },
      { applicantId: "talent-030", pseudonym: "Zed", stories: 1, answers: 0 },
    ]);
  });
  test("needsHelp_acceptedLinksButNoAnswers_countsAsNoAnswers", () => {
    const base = makeDb();
    const db = makeDb({ answers: base.answers.filter((a) => a.applicantId !== "talent-017") });
    expect(needsHelp(db)).toEqual([{ applicantId: "talent-017", pseudonym: "Applicant 017", stories: 2, answers: 0 }]);
  });
  test("needsHelp_doesNotMutateInput", () => {
    const db = makeDb({ answers: [] });
    const copy = structuredClone(db);
    needsHelp(db);
    expect(db).toEqual(copy);
  });
});
