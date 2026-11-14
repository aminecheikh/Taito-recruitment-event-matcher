"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requestMeetings, setMarked } from "@/lib/domain/applicantList";
import { requestMeeting } from "@/lib/domain/meetings";
import { setScore } from "@/lib/domain/scores";
import { ScoreSchema, type Db } from "@/lib/domain/types";
import { getSession } from "@/lib/session";
import { readDb, updateDb } from "@/lib/store/db";

export type ActionStatus = { ok: true } | { ok: false; error: string };

const APPLICANTS_PATH = "/recruiter/applicants";

const ERROR_MESSAGES: Record<string, string> = {
  "no-signal": "This applicant has not signalled your company.",
  "already-requested": "You already requested this meeting.",
  "no-slots-left": "No meeting slots left.",
  "invalid-score": "Scores are whole numbers from 0 to 10.",
  "not-at-event": "This applicant or your company is not registered for this event.",
  "not-core": "That is not one of your core requirements.",
  "nothing-selected": "Select at least one applicant first.",
  "not-recruiter": "Switch to the recruiter role to do this.",
};

const messageFor = (error: string) => Object.hasOwn(ERROR_MESSAGES, error) ? ERROR_MESSAGES[error] : "Something went wrong. Try again.";

const hasSignal = (db: Db, eventId: string, companyId: string, applicantId: string) =>
  db.signals.some((s) => s.eventId === eventId && s.companyId === companyId && s.applicantId === applicantId);

/** Returns a status only, never database contents. */
export async function requestMeetingAction(applicantId: string): Promise<ActionStatus> {
  const session = await getSession();
  const result = await updateDb((db) => requestMeeting(db, session.eventId, session.companyId, applicantId));
  if (!result.ok) return { ok: false, error: messageFor(result.error) };
  revalidatePath(APPLICANTS_PATH);
  return { ok: true };
}

/** Returns a status only, never database contents. */
export async function scoreAction(
  applicantId: string,
  requirementId: string,
  value: number,
  stage: "card" | "conversation",
): Promise<ActionStatus> {
  const session = await getSession();
  const parsed = ScoreSchema.safeParse({ companyId: session.companyId, applicantId, requirementId, stage, value });
  if (!parsed.success) return { ok: false, error: messageFor("invalid-score") };
  const db = await readDb();
  if (!hasSignal(db, session.eventId, session.companyId, applicantId)) {
    return { ok: false, error: messageFor("no-signal") };
  }
  const result = await updateDb((current) => setScore(current, parsed.data));
  if (!result.ok) return { ok: false, error: messageFor(result.error) };
  revalidatePath(APPLICANTS_PATH);
  return { ok: true };
}

export type InviteStatus = { ok: true; invited: number; alreadyInvited: number } | { ok: false; error: string };

// A selection is at most every applicant on the list; the cap only stops absurd payloads.
const MAX_SELECTED = 500;
const SelectionSchema = z.array(z.string().min(1)).min(1).max(MAX_SELECTED);

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function notEnoughSlots(selected: number, slotsLeft: number): string {
  const free = slotsLeft === 0 ? "No free meeting slots are left" : `Only ${plural(slotsLeft, "free meeting slot")} left`;
  return `${free}, and you selected ${plural(selected, "new invite")}. No invites were sent. Please recheck your selection.`;
}

/**
 * Invites every selected applicant through the existing requestMeeting, all or none. Already-invited
 * applicants are skipped and counted. Same messages and checks as the single "Request meeting" button.
 */
export async function inviteSelectedAction(applicantIds: string[]): Promise<InviteStatus> {
  const session = await getSession();
  if (session.role !== "recruiter") return { ok: false, error: messageFor("not-recruiter") };
  const ids = SelectionSchema.safeParse(applicantIds);
  if (!ids.success) return { ok: false, error: messageFor("nothing-selected") };
  // Cast so TS does not narrow to the initial value; updateDb sets it inside the callback.
  let outcome = { ok: false, error: messageFor("") } as InviteStatus;
  await updateDb((db) => {
    const result = requestMeetings(db, session.eventId, session.companyId, ids.data);
    if (!result.ok) {
      outcome = {
        ok: false,
        error: result.error === "not-enough-slots" ? notEnoughSlots(result.selected, result.slotsLeft) : messageFor(result.error),
      };
      return { ok: false, error: result.error };
    }
    outcome = { ok: true, invited: result.value.invited, alreadyInvited: result.value.alreadyInvited };
    return { ok: true, value: result.value.db };
  });
  if (outcome.ok) revalidatePath(APPLICANTS_PATH);
  return outcome;
}

/** Marks or unmarks the selected applicants for later. Reversible, so no confirmation. */
export async function markForLaterAction(applicantIds: string[], marked: boolean): Promise<ActionStatus> {
  const session = await getSession();
  if (session.role !== "recruiter") return { ok: false, error: messageFor("not-recruiter") };
  const ids = SelectionSchema.safeParse(applicantIds);
  if (!ids.success) return { ok: false, error: messageFor("nothing-selected") };
  const result = await updateDb((db) => setMarked(db, session.eventId, session.companyId, ids.data, marked === true));
  if (!result.ok) return { ok: false, error: messageFor(result.error) };
  revalidatePath(APPLICANTS_PATH);
  return { ok: true };
}
