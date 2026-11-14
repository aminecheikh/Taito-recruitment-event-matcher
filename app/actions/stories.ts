"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addStory, updateStory } from "@/lib/domain/stories";
import { LanguageLabelSchema } from "@/lib/domain/types";
import { getSession } from "@/lib/session";
import { updateDb } from "@/lib/store/db";

const STORIES_PATH = "/applicant/stories";
const MAX_TITLE_CHARS = 200;
const MAX_BODY_CHARS = 10_000;

const ERROR_MESSAGES: Record<string, string> = {
  "empty-title": "Give your story a title.",
  "empty-body": "Write something in your story first.",
  "not-found": "That story was not found.",
};

const NewStory = z.object({ title: z.string().max(MAX_TITLE_CHARS), body: z.string().max(MAX_BODY_CHARS) });
const Patch = z.object({
  title: z.string().max(MAX_TITLE_CHARS).optional(),
  body: z.string().max(MAX_BODY_CHARS).optional(),
  languageLabel: LanguageLabelSchema.optional(),
});

export type StoryStatus =
  | { ok: true; storyId?: string }
  | { ok: false; error: "no-applicant" | "not-found" | "invalid" | string };

const messageFor = (error: string) => ERROR_MESSAGES[error] ?? error;

/** Returns a status (and the new story id), never database contents. */
export async function createStory(input: { title: string; body: string }): Promise<StoryStatus> {
  const parsed = NewStory.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That story could not be read." };
  const session = await getSession();
  const created = await updateDb((db) => {
    if (!db.applicants.some((a) => a.id === session.applicantId)) return { ok: false, error: "no-applicant" };
    return addStory(db, session.applicantId, parsed.data);
  });
  if (!created.ok) {
    return { ok: false, error: created.error === "no-applicant" ? "Pick an applicant in the top bar" : messageFor(created.error) };
  }
  const newest = created.value.stories.at(-1);
  revalidatePath(STORIES_PATH);
  return { ok: true, storyId: newest?.id };
}

/** Only the session applicant's own stories can be edited; anything else is "not-found". */
export async function saveStory(
  storyId: string,
  patch: { title?: string; body?: string; languageLabel?: string },
): Promise<StoryStatus> {
  const parsed = Patch.safeParse(patch);
  if (!z.string().min(1).safeParse(storyId).success || !parsed.success) {
    return { ok: false, error: "That story could not be read." };
  }
  const session = await getSession();
  const result = await updateDb((db) => {
    if (!db.applicants.some((a) => a.id === session.applicantId)) return { ok: false, error: "no-applicant" };
    const own = db.stories.some((s) => s.id === storyId && s.applicantId === session.applicantId);
    if (!own) return { ok: false, error: "not-found" };
    return updateStory(db, storyId, parsed.data);
  });
  if (!result.ok) {
    return { ok: false, error: result.error === "no-applicant" ? "Pick an applicant in the top bar" : messageFor(result.error) };
  }
  revalidatePath(STORIES_PATH);
  return { ok: true };
}
