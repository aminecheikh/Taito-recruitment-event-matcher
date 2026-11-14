"use server";

import { revalidatePath } from "next/cache";
import { saveShare } from "@/lib/domain/decisions";
import { applyDecision, ShareDetailsSchema } from "@/lib/domain/meetingDecision";
import type { Db } from "@/lib/domain/types";
import { getSession } from "@/lib/session";
import { updateDb } from "@/lib/store/db";
import type { ActionStatus } from "./recruiter";

const MEETINGS_PATH = "/recruiter/meetings";

const ERROR_MESSAGES: Record<string, string> = {
  "not-found": "Meeting not found.",
  "not-booked": "This meeting is not booked yet.",
  "already-decided": "You already decided on this meeting.",
  "feedback-missing": "Write one feedback line for every core requirement.",
  "scores-missing": "Score every core requirement from 0 to 10 first.",
  "invalid-score": "Scores are whole numbers from 0 to 10.",
  "not-a-match": "Details can only be shared after a match.",
  "invalid-input": "That request was not valid.",
  "invalid-share": "Fill in contact person, next step and timeline.",
};

const ownMeeting = (db: Db, meetingId: string, companyId: string) =>
  db.meetings.find((m) => m.id === meetingId && m.companyId === companyId);

const messageFor = (error: string) => ERROR_MESSAGES[error] ?? "Something went wrong. Try again.";

/** Saves the conversation scores and the company decision together. Returns a status only. */
export async function decideAction(meetingId: string, input: unknown): Promise<ActionStatus> {
  const session = await getSession();
  const result = await updateDb((db) => applyDecision(db, meetingId, session.companyId, input));
  if (!result.ok) return { ok: false, error: messageFor(result.error) };
  revalidatePath(`${MEETINGS_PATH}/${meetingId}`);
  return { ok: true };
}

/** After a match: saves the company's contact person, next step and timeline. Returns a status only. */
export async function shareCompanyDetailsAction(meetingId: string, details: unknown): Promise<ActionStatus> {
  const session = await getSession();
  const parsed = ShareDetailsSchema.safeParse(details);
  if (!parsed.success || typeof meetingId !== "string") return { ok: false, error: messageFor("invalid-share") };
  const part = parsed.data;
  const result = await updateDb((db) =>
    ownMeeting(db, meetingId, session.companyId)
      ? saveShare(db, meetingId, part, "company")
      : { ok: false, error: "not-found" },
  );
  if (!result.ok) return { ok: false, error: messageFor(result.error) };
  revalidatePath(`${MEETINGS_PATH}/${meetingId}`);
  return { ok: true };
}
