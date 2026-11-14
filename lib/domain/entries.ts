import type { Answer, Db, Entry, Result } from "./types";

export type EntryMatchKind = "same" | "similar" | "other";

export type EntryMatch = {
  entry: Entry;
  kind: EntryMatchKind;
  sharedWords: string[];
  usedFor: { requirementId: string; companyName: string; text: string }[];
};

const MIN_WORD_LENGTH = 4;
const STOPWORDS = new Set(
  "with from into under over that this they them their about other each when what have been your using".split(" "),
);
const KIND_ORDER: Record<EntryMatchKind, number> = { same: 0, similar: 1, other: 2 };

function nextEntryId(entries: Entry[]): string {
  const used = new Set(entries.map((e) => e.id));
  let n = entries.length + 1;
  while (used.has(`entry-${n}`)) n += 1;
  return `entry-${n}`;
}

function withAnswer(answers: Answer[], answer: Answer): Answer[] {
  const others = answers.filter(
    (a) => !(a.applicantId === answer.applicantId && a.requirementId === answer.requirementId),
  );
  return [...others, answer];
}

export function writeAnswer(
  db: Db,
  applicantId: string,
  requirementId: string,
  input: { body: string; sourceStoryId?: string },
): Result<Db> {
  const body = input.body.trim();
  if (body === "") return { ok: false, error: "empty-body" };
  if (!db.requirements.some((r) => r.id === requirementId)) return { ok: false, error: "not-found" };
  const story =
    input.sourceStoryId === undefined
      ? undefined
      : db.stories.find((s) => s.id === input.sourceStoryId && s.applicantId === applicantId);
  if (input.sourceStoryId !== undefined && !story) return { ok: false, error: "not-found" };
  const entry: Entry = {
    id: nextEntryId(db.entries),
    applicantId,
    body,
    ...(story?.languageLabel ? { languageLabel: story.languageLabel } : {}),
    ...(story ? { sourceStoryId: story.id } : {}),
  };
  const links = story
    ? db.links.map((l) =>
        l.storyId === story.id && l.requirementId === requirementId ? { ...l, status: "accepted" as const } : l,
      )
    : db.links;
  return {
    ok: true,
    value: {
      ...db,
      entries: [...db.entries, entry],
      answers: withAnswer(db.answers, { applicantId, requirementId, entryId: entry.id }),
      links,
    },
  };
}

export function reuseEntry(db: Db, applicantId: string, requirementId: string, entryId: string): Result<Db> {
  const ownsEntry = db.entries.some((e) => e.id === entryId && e.applicantId === applicantId);
  if (!ownsEntry || !db.requirements.some((r) => r.id === requirementId)) return { ok: false, error: "not-found" };
  return { ok: true, value: { ...db, answers: withAnswer(db.answers, { applicantId, requirementId, entryId }) } };
}

export function editEntry(db: Db, applicantId: string, entryId: string, body: string): Result<Db> {
  const trimmed = body.trim();
  if (trimmed === "") return { ok: false, error: "empty-body" };
  if (!db.entries.some((e) => e.id === entryId && e.applicantId === applicantId)) {
    return { ok: false, error: "not-found" };
  }
  return {
    ok: true,
    value: { ...db, entries: db.entries.map((e) => (e.id === entryId ? { ...e, body: trimmed } : e)) },
  };
}

export function clearAnswer(db: Db, applicantId: string, requirementId: string): Result<Db> {
  const matches = (a: Answer) => a.applicantId === applicantId && a.requirementId === requirementId;
  if (!db.answers.some(matches)) return { ok: false, error: "not-found" };
  return { ok: true, value: { ...db, answers: db.answers.filter((a) => !matches(a)) } };
}

export function deleteEntry(db: Db, applicantId: string, entryId: string): Result<Db> {
  if (!db.entries.some((e) => e.id === entryId && e.applicantId === applicantId)) {
    return { ok: false, error: "not-found" };
  }
  return {
    ok: true,
    value: {
      ...db,
      entries: db.entries.filter((e) => e.id !== entryId),
      answers: db.answers.filter((a) => a.entryId !== entryId),
    },
  };
}

function normaliseText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function wordSet(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter((w) => w.length >= MIN_WORD_LENGTH && !STOPWORDS.has(w))
    .map((w) => (w.length > MIN_WORD_LENGTH && w.endsWith("s") ? w.slice(0, -1) : w));
  return new Set(words);
}

/** Orders the applicant's own entries by how well they fit a requirement; never ranks people. */
export function entryMatches(db: Db, applicantId: string, requirementId: string): EntryMatch[] {
  const target = db.requirements.find((r) => r.id === requirementId);
  if (!target) return [];
  const targetText = normaliseText(target.text);
  const targetWords = wordSet(target.text);
  const matches = db.entries
    .filter((e) => e.applicantId === applicantId)
    .filter((e) => !db.answers.some((a) => a.entryId === e.id && a.requirementId === requirementId))
    .map((entry): EntryMatch => {
      const usedFor = db.answers
        .filter((a) => a.entryId === entry.id)
        .flatMap((a) => {
          const req = db.requirements.find((r) => r.id === a.requirementId);
          if (!req) return [];
          const companyName = db.companies.find((c) => c.id === req.companyId)?.name ?? "";
          return [{ requirementId: req.id, companyName, text: req.text }];
        });
      const usedWords = new Set(usedFor.flatMap((u) => [...wordSet(u.text)]));
      const sharedWords = [...targetWords].filter((w) => usedWords.has(w)).sort();
      const isSame = usedFor.some((u) => normaliseText(u.text) === targetText);
      const kind: EntryMatchKind = isSame ? "same" : sharedWords.length > 0 ? "similar" : "other";
      return { entry, kind, sharedWords: kind === "other" ? [] : sharedWords, usedFor };
    });
  return matches.sort(
    (a, b) =>
      KIND_ORDER[a.kind] - KIND_ORDER[b.kind] ||
      b.sharedWords.length - a.sharedWords.length ||
      a.entry.id.localeCompare(b.entry.id),
  );
}
