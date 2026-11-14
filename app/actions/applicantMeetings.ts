"use server";

import { revalidatePath } from "next/cache";
import { acceptMeeting } from "@/lib/domain/meetings";
import { recordDecision, saveShare } from "@/lib/domain/decisions";
import { buildApplicantShare, type ShareChoice } from "@/lib/domain/shareInput";
import type { Db, Result } from "@/lib/domain/types";
import { getSession } from "@/lib/session";
import { updateDb } from "@/lib/store/db";

export type MeetingStatus = { ok: true } | { ok: false; error: string };

const MEETINGS_PATH = "/applicant/meetings";

/** Runs a change only if the meeting belongs to the session applicant. Returns a status, never Db. */
async function ownMeeting(meetingId: string, change: (db: Db) => Result<Db>): Promise<MeetingStatus> {
  const session = await getSession();
  const result = await updateDb((db) => {
    const known = db.applicants.some((a) => a.id === session.applicantId);
    const own = db.meetings.some((m) => m.id === meetingId && m.applicantId === session.applicantId);
    if (!known || !own) return { ok: false, error: "not-found" } as const;
    return change(db);
  });
  if (!result.ok) return { ok: false, error: result.error };
  revalidatePath(MEETINGS_PATH);
  revalidatePath(`${MEETINGS_PATH}/${meetingId}`);
  return { ok: true };
}

export async function acceptMeetingAction(meetingId: string): Promise<MeetingStatus> {
  return ownMeeting(meetingId, (db) => acceptMeeting(db, meetingId));
}

export async function decideAction(meetingId: string, shouldContinue: boolean): Promise<MeetingStatus> {
  return ownMeeting(meetingId, (db) =>
    recordDecision(db, { meetingId, side: "applicant", continue: shouldContinue === true }),
  );
}

export async function saveApplicantShareAction(meetingId: string, choice: ShareChoice): Promise<MeetingStatus> {
  const session = await getSession();
  const safe: ShareChoice = {
    shareEmail: choice?.shareEmail === true,
    shareCv: choice?.shareCv === true,
    cvUrl: String(choice?.cvUrl ?? ""),
    sharePortfolio: choice?.sharePortfolio === true,
    portfolioUrl: String(choice?.portfolioUrl ?? ""),
  };
  return ownMeeting(meetingId, (db) => {
    const applicant = db.applicants.find((a) => a.id === session.applicantId);
    if (!applicant) return { ok: false, error: "not-found" };
    const part = buildApplicantShare(applicant, safe);
    if (!part.ok) return part;
    return saveShare(db, meetingId, part.value, "applicant");
  });
}
