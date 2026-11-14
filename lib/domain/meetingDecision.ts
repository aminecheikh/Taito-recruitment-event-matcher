import { z } from "zod";
import { recordDecision } from "./decisions";
import { coreRequirements } from "./requirements";
import { setScore } from "./scores";
import type { Db, Result } from "./types";

const MAX_TEXT = 500;

export const DecideInputSchema = z.object({
  scores: z.record(z.string().max(100), z.number().int().min(0).max(10)),
  continue: z.boolean(),
  feedback: z.record(z.string().max(100), z.string().max(MAX_TEXT)),
});
export type DecideInput = z.infer<typeof DecideInputSchema>;

export const ShareDetailsSchema = z.object({
  contactPerson: z.string().trim().min(1).max(MAX_TEXT),
  nextStep: z.string().trim().min(1).max(MAX_TEXT),
  timeline: z.string().trim().min(1).max(MAX_TEXT),
});

/** Scores every core requirement (stage "conversation") and records the company decision; all-or-nothing. */
export function applyDecision(db: Db, meetingId: string, companyId: string, raw: unknown): Result<Db> {
  const parsed = DecideInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "invalid-input" };
  const input = parsed.data;
  const meeting = db.meetings.find((m) => m.id === meetingId && m.companyId === companyId);
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
