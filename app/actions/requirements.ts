"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { setRequirements } from "@/lib/domain/requirements";
import { MAX_CORE_REQUIREMENTS, RequirementSchema, type Requirement } from "@/lib/domain/types";
import { getSession } from "@/lib/session";
import { updateDb } from "@/lib/store/db";

const TOO_MANY_CORE_MESSAGE = `Which ones would you actually hire on? Pick at most ${MAX_CORE_REQUIREMENTS}.`;

const ERROR_MESSAGES: Record<string, string> = {
  "no-core": "Pick at least one core requirement before saving.",
  "too-many-core": TOO_MANY_CORE_MESSAGE,
  "company-mismatch": "These requirements belong to a different company.",
};

/** Ranks follow list order (1..n), so the stored order is exactly what the recruiter saw. */
function normalise(reqs: Requirement[]): Requirement[] {
  return reqs.map((r, index) => ({
    ...r,
    text: r.text.trim(),
    inPractice: r.inPractice.trim(),
    rank: index + 1,
  }));
}

function checkContent(reqs: Requirement[]): string | null {
  if (reqs.some((r) => r.text === "")) return "Every requirement needs a name.";
  if (reqs.some((r) => r.isCore && r.inPractice === "")) {
    return 'Add an "in practice" line to every core requirement.';
  }
  return null;
}

export type SaveStatus = { ok: true } | { ok: false; error: string };

/** Returns a status only, never database contents. */
export async function saveRequirements(companyId: string, reqs: Requirement[]): Promise<SaveStatus> {
  const parsed = z.array(RequirementSchema).safeParse(reqs);
  if (!parsed.success) return { ok: false, error: "Those requirements could not be read." };
  const session = await getSession();
  if (session.companyId !== companyId) {
    return { ok: false, error: "Pick this company in the top bar before saving." };
  }
  const next = normalise(parsed.data);
  const contentError = checkContent(next);
  if (contentError) return { ok: false, error: contentError };

  const result = await updateDb((db) => setRequirements(db, companyId, next));
  if (!result.ok) return { ok: false, error: ERROR_MESSAGES[result.error] ?? result.error };
  revalidatePath("/recruiter/requirements");
  return { ok: true };
}
