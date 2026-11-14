import { describe, expect, test } from "vitest";
import { entryMatches, clearAnswer, deleteEntry, editEntry, reuseEntry, writeAnswer } from "./entries";
import { makeDb } from "./fixtures";
import type { Db, Entry, Requirement } from "./types";

const A = "talent-017";
const entry = (id: string, body = `Body ${id}`, extra: Partial<Entry> = {}): Entry => ({
  id, applicantId: A, body, ...extra,
});
const answer = (requirementId: string, entryId: string, applicantId = A) => ({ applicantId, requirementId, entryId });
const must = (r: { ok: boolean; value?: Db; error?: string }): Db => {
  if (!r.ok) throw new Error(String(r.error));
  return r.value as Db;
};

describe("writeAnswer", () => {
  test("writeAnswer_validInput_createsTrimmedEntryAndAnswer", () => {
    const db = makeDb({ entries: [], answers: [] });
    const snapshot = JSON.stringify(db);
    const next = must(writeAnswer(db, A, "req-01-1", { body: "  I did it  " }));
    expect(next.entries).toEqual([{ id: "entry-1", applicantId: A, body: "I did it" }]);
    expect(next.answers).toEqual([answer("req-01-1", "entry-1")]);
    expect(JSON.stringify(db)).toBe(snapshot);
  });
  test("writeAnswer_blankBody_refusesEmptyBody", () =>
    expect(writeAnswer(makeDb(), A, "req-01-1", { body: "   " })).toEqual({ ok: false, error: "empty-body" }));
  test("writeAnswer_unknownRequirement_refusesNotFound", () =>
    expect(writeAnswer(makeDb(), A, "nope", { body: "x" })).toEqual({ ok: false, error: "not-found" }));
  test("writeAnswer_someoneElsesStory_refusesNotFound", () =>
    expect(writeAnswer(makeDb(), A, "req-01-1", { body: "x", sourceStoryId: "story-020-a" })).toEqual({
      ok: false, error: "not-found",
    }));
  test("writeAnswer_unknownStory_refusesNotFound", () =>
    expect(writeAnswer(makeDb(), A, "req-01-1", { body: "x", sourceStoryId: "ghost" })).toEqual({
      ok: false, error: "not-found",
    }));
  test("writeAnswer_existingAnswer_replacesItAndKeepsOldEntry", () => {
    const first = must(writeAnswer(makeDb({ entries: [], answers: [] }), A, "req-01-1", { body: "one" }));
    const second = must(writeAnswer(first, A, "req-01-1", { body: "two" }));
    expect(second.entries.map((e) => e.id)).toEqual(["entry-1", "entry-2"]);
    expect(second.answers).toEqual([answer("req-01-1", "entry-2")]);
  });
  test("writeAnswer_idsInUse_picksNextFreeEntryId", () => {
    const db = makeDb({ entries: [entry("entry-2")] });
    const next = must(writeAnswer(db, A, "req-01-1", { body: "x" }));
    expect(next.entries.map((e) => e.id)).toEqual(["entry-2", "entry-3"]);
  });
  test("writeAnswer_storyWithLabel_copiesLabelAndSource", () => {
    const base = makeDb();
    const db = makeDb({
      entries: [],
      answers: [],
      stories: base.stories.map((s) => (s.id === "story-017-a" ? { ...s, languageLabel: "language edited" as const } : s)),
    });
    const next = must(writeAnswer(db, A, "req-01-1", { body: "x", sourceStoryId: "story-017-a" }));
    expect(next.entries[0]).toMatchObject({ languageLabel: "language edited", sourceStoryId: "story-017-a" });
  });
  test("writeAnswer_storyWithoutLabel_omitsLabelKey", () => {
    const next = must(writeAnswer(makeDb({ entries: [], answers: [] }), A, "req-01-1", { body: "x", sourceStoryId: "story-017-a" }));
    expect("languageLabel" in next.entries[0]).toBe(false);
  });
  test("writeAnswer_pendingLinkForStoryAndRequirement_becomesAccepted", () => {
    const next = must(writeAnswer(makeDb({ entries: [], answers: [] }), A, "req-01-3", { body: "x", sourceStoryId: "story-017-b" }));
    expect(next.links.find((l) => l.id === "link-017-2")?.status).toBe("accepted");
    expect(next.links.find((l) => l.id === "link-017-3")?.status).toBe("rejected");
  });
});

describe("reuseEntry", () => {
  test("reuseEntry_ownEntry_answersTwoRequirementsWithoutNewEntry", () => {
    const db = makeDb({ entries: [entry("entry-1")], answers: [answer("req-01-1", "entry-1")] });
    const next = must(reuseEntry(db, A, "req-01-2", "entry-1"));
    expect(next.entries).toHaveLength(1);
    expect(next.answers).toEqual([answer("req-01-1", "entry-1"), answer("req-01-2", "entry-1")]);
  });
  test("reuseEntry_existingAnswer_replacesIt", () => {
    const db = makeDb({
      entries: [entry("entry-1"), entry("entry-2")],
      answers: [answer("req-01-1", "entry-1")],
    });
    expect(must(reuseEntry(db, A, "req-01-1", "entry-2")).answers).toEqual([answer("req-01-1", "entry-2")]);
  });
  test("reuseEntry_otherApplicantsEntry_refusesNotFound", () => {
    const db = makeDb({ entries: [entry("entry-9", "x", { applicantId: "talent-020" })] });
    expect(reuseEntry(db, A, "req-01-1", "entry-9")).toEqual({ ok: false, error: "not-found" });
  });
  test("reuseEntry_unknownRequirement_refusesNotFound", () => {
    const db = makeDb({ entries: [entry("entry-1")] });
    expect(reuseEntry(db, A, "nope", "entry-1")).toEqual({ ok: false, error: "not-found" });
  });
});

describe("editEntry", () => {
  const db = makeDb({
    entries: [entry("entry-1", "old", { languageLabel: "language edited", sourceStoryId: "story-017-a" })],
    answers: [answer("req-01-1", "entry-1"), answer("req-01-2", "entry-1")],
  });
  test("editEntry_validBody_updatesTrimmedKeepsLabelAndSource", () => {
    const next = must(editEntry(db, A, "entry-1", "  new  "));
    expect(next.entries[0]).toEqual({
      id: "entry-1", applicantId: A, body: "new", languageLabel: "language edited", sourceStoryId: "story-017-a",
    });
    expect(next.answers).toEqual(db.answers);
  });
  test("editEntry_blankBody_refusesEmptyBody", () =>
    expect(editEntry(db, A, "entry-1", " ")).toEqual({ ok: false, error: "empty-body" }));
  test("editEntry_otherApplicant_refusesNotFound", () =>
    expect(editEntry(db, "talent-020", "entry-1", "x")).toEqual({ ok: false, error: "not-found" }));
  test("editEntry_unknownEntry_refusesNotFound", () =>
    expect(editEntry(db, A, "ghost", "x")).toEqual({ ok: false, error: "not-found" }));
});

describe("clearAnswer and deleteEntry", () => {
  const db = makeDb({
    entries: [entry("entry-1")],
    answers: [answer("req-01-1", "entry-1"), answer("req-01-2", "entry-1")],
  });
  test("clearAnswer_existing_removesAnswerKeepsEntry", () => {
    const next = must(clearAnswer(db, A, "req-01-1"));
    expect(next.answers).toEqual([answer("req-01-2", "entry-1")]);
    expect(next.entries).toHaveLength(1);
  });
  test("clearAnswer_noAnswer_refusesNotFound", () =>
    expect(clearAnswer(db, A, "req-01-3")).toEqual({ ok: false, error: "not-found" }));
  test("deleteEntry_used_removesEntryAndAllItsAnswers", () => {
    const next = must(deleteEntry(db, A, "entry-1"));
    expect(next.entries).toEqual([]);
    expect(next.answers).toEqual([]);
  });
  test("deleteEntry_otherApplicant_refusesNotFound", () =>
    expect(deleteEntry(db, "talent-020", "entry-1")).toEqual({ ok: false, error: "not-found" }));
});

describe("entryMatches", () => {
  const req = (id: string, companyId: string, text: string): Requirement => ({
    id, companyId, text, inPractice: "p", rank: 1, isCore: true,
  });
  const base = makeDb();
  const withReqs = (extra: Partial<Db>): Db =>
    makeDb({
      companies: [...base.companies, { id: "company-02", name: "Other Co", sector: "S", sizeRange: "1" }],
      requirements: [
        req("t", "company-01", "Writing clear care notes"),
        req("same", "company-02", "  writing CLEAR   care notes "),
        req("sim", "company-02", "Writing incident reports"),
        req("none", "company-02", "Driving forklifts"),
      ],
      ...extra,
    });

  test("entryMatches_identicalTextAtOtherCompany_isSame", () => {
    const db = withReqs({ entries: [entry("entry-1")], answers: [answer("same", "entry-1")] });
    const [m] = entryMatches(db, A, "t");
    expect(m.kind).toBe("same");
    expect(m.usedFor).toEqual([{ requirementId: "same", companyName: "Other Co", text: "  writing CLEAR   care notes " }]);
  });
  test("entryMatches_overlappingWord_isSimilarWithSharedWords", () => {
    const db = withReqs({ entries: [entry("entry-1")], answers: [answer("sim", "entry-1")] });
    const [m] = entryMatches(db, A, "t");
    expect(m.kind).toBe("similar");
    expect(m.sharedWords).toEqual(["writing"]);
  });
  test("entryMatches_noOverlapOrUnused_isOtherWithNoWords", () => {
    const db = withReqs({
      entries: [entry("entry-1"), entry("entry-2")],
      answers: [answer("none", "entry-1")],
    });
    const ms = entryMatches(db, A, "t");
    expect(ms.map((m) => [m.entry.id, m.kind, m.sharedWords])).toEqual([
      ["entry-1", "other", []],
      ["entry-2", "other", []],
    ]);
    expect(ms[1].usedFor).toEqual([]);
  });
  test("entryMatches_mixed_ordersSameThenSimilarByWordsThenOther", () => {
    const db = withReqs({
      requirements: [
        req("t", "company-01", "Writing clear care notes"),
        req("same", "company-02", "Writing clear care notes"),
        req("sim1", "company-02", "Writing incident reports"),
        req("sim2", "company-02", "Clear writing of care plans"),
        req("none", "company-02", "Driving forklifts"),
      ],
      entries: [entry("entry-1"), entry("entry-2"), entry("entry-3"), entry("entry-4")],
      answers: [answer("none", "entry-1"), answer("sim1", "entry-2"), answer("sim2", "entry-3"), answer("same", "entry-4")],
    });
    expect(entryMatches(db, A, "t").map((m) => [m.entry.id, m.kind])).toEqual([
      ["entry-4", "same"],
      ["entry-3", "similar"],
      ["entry-2", "similar"],
      ["entry-1", "other"],
    ]);
  });
  test("entryMatches_pluralsStopwordsAndShortWords_areNormalised", () => {
    const db = withReqs({
      requirements: [
        req("t", "company-01", "Notes with their team"),
        req("o", "company-02", "Note taking when they talk"),
      ],
      entries: [entry("entry-1")],
      answers: [answer("o", "entry-1")],
    });
    expect(entryMatches(db, A, "t")[0].sharedWords).toEqual(["note"]);
  });
  test("entryMatches_entryAlreadyAnswering_isExcluded", () => {
    const db = withReqs({ entries: [entry("entry-1")], answers: [answer("t", "entry-1")] });
    expect(entryMatches(db, A, "t")).toEqual([]);
  });
  test("entryMatches_otherApplicantsEntries_areNeverListed", () => {
    const db = withReqs({ entries: [entry("entry-1", "x", { applicantId: "talent-020" })] });
    expect(entryMatches(db, A, "t")).toEqual([]);
  });
  test("entryMatches_unknownRequirement_returnsEmpty", () =>
    expect(entryMatches(withReqs({ entries: [entry("entry-1")] }), A, "ghost")).toEqual([]));
});
