import type { Db, LanguageLabel, Result, Story } from "./types";

export type StoryPatch = { title?: string; body?: string; languageLabel?: LanguageLabel };

function nextStoryId(stories: Story[]): string {
  const used = new Set(stories.map((s) => s.id));
  let n = stories.length + 1;
  while (used.has(`story-${n}`)) n += 1;
  return `story-${n}`;
}

export function addStory(
  db: Db,
  applicantId: string,
  input: { title: string; body: string },
): Result<Db> {
  const title = input.title.trim();
  const body = input.body.trim();
  if (title === "") return { ok: false, error: "empty-title" };
  if (body === "") return { ok: false, error: "empty-body" };
  const story: Story = { id: nextStoryId(db.stories), applicantId, title, body };
  return { ok: true, value: { ...db, stories: [...db.stories, story] } };
}

/** Links are untouched; an existing languageLabel stays unless the patch sets one. */
export function updateStory(db: Db, storyId: string, patch: StoryPatch): Result<Db> {
  const current = db.stories.find((s) => s.id === storyId);
  if (!current) return { ok: false, error: "not-found" };
  const title = patch.title === undefined ? current.title : patch.title.trim();
  const body = patch.body === undefined ? current.body : patch.body.trim();
  if (title === "") return { ok: false, error: "empty-title" };
  if (body === "") return { ok: false, error: "empty-body" };
  const next: Story = { ...current, title, body, languageLabel: patch.languageLabel ?? current.languageLabel };
  if (next.languageLabel === undefined) delete next.languageLabel;
  return { ok: true, value: { ...db, stories: db.stories.map((s) => (s.id === storyId ? next : s)) } };
}
