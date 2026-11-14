"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { coreIdsAtEvent } from "@/lib/domain/attendance";
import { addSuggestions, rejectLink } from "@/lib/domain/links";
import type { Db, Result } from "@/lib/domain/types";
import { getSession } from "@/lib/session";
import { updateDb } from "@/lib/store/db";

const COMPANIES_PATH = "/applicant/companies";
const MAX_SUGGESTIONS = 20;
const MAX_REASON_CHARS = 1_000;

const ERROR_MESSAGES: Record<string, string> = {
  "not-found": "That example or requirement was not found.",
};

const Id = z.string().min(1).max(200);
const Suggestions = z
  .array(z.object({ requirementId: Id, reason: z.string().min(1).max(MAX_REASON_CHARS) }))
  .max(MAX_SUGGESTIONS);

export type LinkStatus = { ok: true; added?: number } | { ok: false; error: string };

type Scope = { applicantId: string; eventId: string };

const ownsStory = (db: Db, storyId: string, applicantId: string) =>
  db.stories.some((s) => s.id === storyId && s.applicantId === applicantId);

const ownsLink = (db: Db, linkId: string, applicantId: string) => {
  const link = db.links.find((l) => l.id === linkId);
  return link !== undefined && ownsStory(db, link.storyId, applicantId);
};

/** Runs a change after the session applicant, ownership and core-requirement checks done by `guard`. */
async function run(
  guard: (db: Db, scope: Scope, core: Set<string>) => string | null,
  change: (db: Db, core: Set<string>) => Result<Db>,
): Promise<LinkStatus> {
  const session = await getSession();
  const scope = { applicantId: session.applicantId, eventId: session.eventId };
  const result = await updateDb((db) => {
    if (!db.applicants.some((a) => a.id === scope.applicantId)) return { ok: false, error: "no-applicant" };
    const core = coreIdsAtEvent(db, scope.eventId);
    const refusal = guard(db, scope, core);
    return refusal ? { ok: false, error: refusal } : change(db, core);
  });
  if (!result.ok) {
    return { ok: false, error: result.error === "no-applicant" ? "Pick an applicant in the top bar" : (Object.hasOwn(ERROR_MESSAGES, result.error) ? ERROR_MESSAGES[result.error] : result.error) };
  }
  revalidatePath(COMPANIES_PATH);
  return { ok: true };
}

const invalid: LinkStatus = { ok: false, error: "That request could not be read." };

/**
 * Stores AI suggestions as pending links. Suggestions whose target is not a current core
 * requirement at the event (stale ids) are dropped; the rest are kept. `added` counts new links.
 */
export async function saveSuggestions(storyId: string, suggestions: { requirementId: string; reason: string }[]): Promise<LinkStatus> {
  const parsed = Suggestions.safeParse(suggestions);
  if (!Id.safeParse(storyId).success || !parsed.success) return invalid;
  let added = 0;
  const status = await run(
    (db, { applicantId }) => (ownsStory(db, storyId, applicantId) ? null : "not-found"),
    (db, core) => {
      const valid = parsed.data.filter((s) => core.has(s.requirementId));
      const next = addSuggestions(db, storyId, valid);
      added = next.links.length - db.links.length;
      return { ok: true, value: next };
    },
  );
  return status.ok ? { ok: true, added } : status;
}

export async function rejectSuggestion(linkId: string): Promise<LinkStatus> {
  if (!Id.safeParse(linkId).success) return invalid;
  return run(
    (db, { applicantId }) => (ownsLink(db, linkId, applicantId) ? null : "not-found"),
    (db) => rejectLink(db, linkId),
  );
}
