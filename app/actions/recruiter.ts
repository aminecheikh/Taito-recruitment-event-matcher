"use server";

import { revalidatePath } from "next/cache";
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
  "not-core": "That is not one of your core requirements.",
};

const messageFor = (error: string) => ERROR_MESSAGES[error] ?? "Something went wrong. Try again.";

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
