import { z } from "zod";
import { languageAssist } from "@/lib/ai/functions";
import { labelFor } from "@/lib/ai/guardrails";
import { handle } from "@/lib/ai/http";

const Body = z.object({
  text: z.string().min(1),
  mode: z.enum(["grammar", "translate"]),
  sourceLanguage: z.string().optional(),
  targetLanguage: z.string().optional(),
});

export const POST = handle(
  Body,
  (input) => languageAssist(input),
  ({ text, mode, sourceLanguage }) => ({ text, label: labelFor(mode, sourceLanguage) }),
);
