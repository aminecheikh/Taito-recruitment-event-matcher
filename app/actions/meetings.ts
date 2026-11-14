"use server";

import { revalidatePath } from "next/cache";
import { coreRequirements } from "@/lib/domain/requirements";
import { recordDecision, saveShare } from "@/lib/domain/decisions";
import { setScore } from "@/lib/domain/scores";
import { ShareSchema, type Db, type Result } from "@/lib/domain/types";
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
  "invalid-share": "Fill in contact person, next step and timeline.",
};

const messageFor = (error: string) => ERROR_MESSAGES[error] ?? "Something went wrong. Try again.";

export type DecideInput = {
  scores: Record<string, number>;
  continue: boolean;
  feedback: Record<string, string>;
};

const ownMeeting = (db: Db, meetingId: string, companyId: string) =>
  db.meetings.find((m) => m.id === meetingId && m.companyId === companyId);

function applyDecision(db: Db, meetingId: string, companyId: string, input: DecideInput): Result<Db> {
  const meeting = ownMeeting(db, meetingId, companyId);
  if (!meeting) return { ok: false, error: "not-found" };
  const core = coreRequirements(db, companyId);
  if (core.some((r) => input.scores[r.id] === undefined)) return { ok: false, error: "scores-missing" };
  let next: Db = db;
  for (const r of core) {
    const scored = setScore(next, {
      companyId,
      applicantId: meeting.applicantId,
      requirementId: r.id,
      stage: "conversation",
      value: input.scores[r.id],
    });
    if (!scored.ok) return scored;
    next = scored.value;
  }
  const feedback = input.continue
    ? undefined
    : Object.fromEntries(core.map((r) => [r.id, (input.feedback[r.id] ?? "").trim()]));
  return recordDecision(next, { meetingId, side: "company", continue: input.continue, feedback });
}

/** Saves the conversation scores and the company decision together. Returns a status only. */
export async function decideAction(meetingId: string, input: DecideInput): Promise<ActionStatus> {
  const session = await getSession();
  const result = await updateDb((db) => applyDecision(db, meetingId, session.companyId, input));
  if (!result.ok) return { ok: false, error: messageFor(result.error) };
  revalidatePath(`${MEETINGS_PATH}/${meetingId}`);
  return { ok: true };
}

/** After a match: saves the company's contact person, next step and timeline. Returns a status only. */
export async function shareCompanyDetailsAction(
  meetingId: string,
  details: { contactPerson: string; nextStep: string; timeline: string },
): Promise<ActionStatus> {
  const session = await getSession();
  const parsed = ShareSchema.shape.company.unwrap().safeParse({
    contactPerson: details.contactPerson.trim(),
    nextStep: details.nextStep.trim(),
    timeline: details.timeline.trim(),
  });
  const complete = parsed.success && Object.values(parsed.data).every((v) => v !== "");
  if (!parsed.success || !complete) return { ok: false, error: messageFor("invalid-share") };
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
