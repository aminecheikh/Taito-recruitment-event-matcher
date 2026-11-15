"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { deleteApplicantData, deleteStory } from "@/lib/domain/privacy";
import { getSession } from "@/lib/session";
import { updateDb } from "@/lib/store/db";

export type PrivacyStatus = { ok: true } | { ok: false; error: string };

const NO_APPLICANT = "Pick an applicant in the top bar";
const NOT_FOUND = "That story was not found.";

/** Only the session applicant's own story can be deleted. Returns a status, never database contents. */
export async function deleteStoryAction(storyId: string): Promise<PrivacyStatus> {
  if (!z.string().min(1).safeParse(storyId).success) return { ok: false, error: NOT_FOUND };
  const session = await getSession();
  if (session.role !== "applicant") return { ok: false, error: NO_APPLICANT };
  const result = await updateDb((db) => deleteStory(db, session.applicantId, storyId));
  if (!result.ok) return { ok: false, error: NOT_FOUND };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Removes everything held about the session applicant. */
export async function deleteMyDataAction(): Promise<PrivacyStatus> {
  const session = await getSession();
  if (session.role !== "applicant") return { ok: false, error: NO_APPLICANT };
  const result = await updateDb((db) => deleteApplicantData(db, session.applicantId));
  if (!result.ok) return { ok: false, error: NO_APPLICANT };
  revalidatePath("/", "layout");
  return { ok: true };
}
