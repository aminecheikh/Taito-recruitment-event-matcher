import { z } from "zod";
import { extractRequirements } from "@/lib/ai/functions";
import { handle } from "@/lib/ai/http";
import { mockExtractRequirements } from "@/lib/ai/mock";

const Body = z.object({ jobAd: z.string().min(1) });

export const POST = handle(
  Body,
  ({ jobAd }) => extractRequirements(jobAd),
  ({ jobAd }) => mockExtractRequirements(jobAd),
);
