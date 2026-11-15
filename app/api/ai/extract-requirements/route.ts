import { z } from "zod";
import { extractRequirements } from "@/lib/ai/functions";
import { guardJobAd, REFUSAL_MESSAGE } from "@/lib/ai/guardrails";
import { handle } from "@/lib/ai/http";
import { mockExtractRequirements } from "@/lib/ai/mock";

const Body = z.object({ jobAd: z.string().min(1) });

export const POST = handle(
  Body,
  ({ jobAd }) => extractRequirements(jobAd),
  ({ jobAd }) => mockExtractRequirements(jobAd),
  ({ jobAd }) => {
    const guarded = guardJobAd(jobAd);
    return guarded.kind === "refuse"
      ? { kind: "refuse", error: "judges-people", message: REFUSAL_MESSAGE }
      : { kind: "ok", input: { jobAd: guarded.text }, removed: guarded.removed };
  },
);
