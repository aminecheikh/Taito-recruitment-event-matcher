import { z } from "zod";
import { cvSuggestions } from "@/lib/ai/functions";
import { handle } from "@/lib/ai/http";
import { mockCvSuggestions } from "@/lib/ai/mock";
import { coreIdsAtEvent } from "@/lib/domain/attendance";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";

const MIN_CV_CHARS = 50;
const MAX_CV_CHARS = 15000;
const Body = z.object({ cvText: z.string().min(MIN_CV_CHARS).max(MAX_CV_CHARS) });

/** Requirements come from the session event's core requirements; the CV is processed in memory and never stored. */
async function loadRequirements() {
  const [db, session] = await Promise.all([readDb(), getSession()]);
  const coreIds = coreIdsAtEvent(db, session.eventId);
  return db.requirements.filter((r) => coreIds.has(r.id));
}

export const POST = handle(
  Body,
  async ({ cvText }) => cvSuggestions({ cvText, requirements: await loadRequirements() }),
  async ({ cvText }) => mockCvSuggestions(cvText, await loadRequirements()),
);
