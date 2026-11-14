"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { coreIdsAtEvent } from "@/lib/domain/attendance";
import { clearAnswer, deleteEntry, editEntry, reuseEntry, writeAnswer } from "@/lib/domain/entries";
import type { Db, Result } from "@/lib/domain/types";
import { getSession } from "@/lib/session";
import { updateDb } from "@/lib/store/db";

const MAX_BODY_CHARS = 10_000;

const ERROR_MESSAGES: Record<string, string> = {
  "not-found": "That example or requirement was not found.",
  "empty-body": "Write something before saving.",
};

const Id = z.string().min(1).max(200);
const Body = z.string().max(MAX_BODY_CHARS);

export type EntryStatus = { ok: true } | { ok: false; error: string };

const invalid: EntryStatus = { ok: false, error: "That request could not be read." };

type Scope = { applicantId: string; core: Set<string> };

const ownsEntry = (db: Db, entryId: string, applicantId: string) =>
  db.entries.some((e) => e.id === entryId && e.applicantId === applicantId);

const ownsStory = (db: Db, storyId: string, applicantId: string) =>
  db.stories.some((s) => s.id === storyId && s.applicantId === applicantId);

function message(error: string): string {
  if (error === "no-applicant") return "Pick an applicant in the top bar";
  return Object.hasOwn(ERROR_MESSAGES, error) ? ERROR_MESSAGES[error] : error;
}

/** Runs a change for the session applicant once `allowed` (ownership, core-requirement checks) passes. */
async function run(
  allowed: (db: Db, scope: Scope) => boolean,
  change: (db: Db, applicantId: string) => Result<Db>,
): Promise<EntryStatus> {
  const session = await getSession();
  const result = await updateDb((db) => {
    if (!db.applicants.some((a) => a.id === session.applicantId)) return { ok: false, error: "no-applicant" };
    const scope = { applicantId: session.applicantId, core: coreIdsAtEvent(db, session.eventId) };
    return allowed(db, scope) ? change(db, session.applicantId) : { ok: false, error: "not-found" };
  });
  if (!result.ok) return { ok: false, error: message(result.error) };
  revalidatePath("/applicant/companies", "layout");
  revalidatePath("/applicant/entries");
  return { ok: true };
}

/** Writes a new entry as the answer to a card; `sourceStoryId` marks the matching story link accepted. */
export async function saveAnswer(requirementId: string, body: string, sourceStoryId?: string): Promise<EntryStatus> {
  const storyOk = sourceStoryId === undefined || Id.safeParse(sourceStoryId).success;
  if (!Id.safeParse(requirementId).success || !Body.safeParse(body).success || !storyOk) return invalid;
  return run(
    (db, { applicantId, core }) =>
      core.has(requirementId) && (sourceStoryId === undefined || ownsStory(db, sourceStoryId, applicantId)),
    (db, applicantId) => writeAnswer(db, applicantId, requirementId, { body, sourceStoryId }),
  );
}

/** Points a card at an entry the applicant already saved. */
export async function reuseSavedEntry(requirementId: string, entryId: string): Promise<EntryStatus> {
  if (!Id.safeParse(requirementId).success || !Id.safeParse(entryId).success) return invalid;
  return run(
    (db, { applicantId, core }) => core.has(requirementId) && ownsEntry(db, entryId, applicantId),
    (db, applicantId) => reuseEntry(db, applicantId, requirementId, entryId),
  );
}

/** Edits an entry's text everywhere it is used. */
export async function editSavedEntry(entryId: string, body: string): Promise<EntryStatus> {
  if (!Id.safeParse(entryId).success || !Body.safeParse(body).success) return invalid;
  return run(
    (db, { applicantId }) => ownsEntry(db, entryId, applicantId),
    (db, applicantId) => editEntry(db, applicantId, entryId, body),
  );
}

/** Clears a card's answer; the entry stays saved. */
export async function removeAnswer(requirementId: string): Promise<EntryStatus> {
  if (!Id.safeParse(requirementId).success) return invalid;
  return run(
    (_db, { core }) => core.has(requirementId),
    (db, applicantId) => clearAnswer(db, applicantId, requirementId),
  );
}

/** Deletes an entry and every answer that uses it. */
export async function deleteSavedEntry(entryId: string): Promise<EntryStatus> {
  if (!Id.safeParse(entryId).success) return invalid;
  return run(
    (db, { applicantId }) => ownsEntry(db, entryId, applicantId),
    (db, applicantId) => deleteEntry(db, applicantId, entryId),
  );
}
