"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { setMovingHelp } from "@/lib/domain/movingHelp";
import { getSession } from "@/lib/session";
import { updateDb } from "@/lib/store/db";

export type MovingHelpStatus = { ok: true } | { ok: false; error: string };

export async function setMovingHelpAction(on: boolean): Promise<MovingHelpStatus> {
  const parsed = z.boolean().safeParse(on);
  if (!parsed.success) return { ok: false, error: "Invalid choice." };
  const session = await getSession();
  if (session.role !== "applicant") return { ok: false, error: "Pick an applicant in the top bar" };
  const result = await updateDb((db) => setMovingHelp(db, session.applicantId, parsed.data));
  if (!result.ok) return { ok: false, error: "Pick an applicant in the top bar" };
  revalidatePath("/applicant/meetings");
  return { ok: true };
}
