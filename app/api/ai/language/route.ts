import { z } from "zod";
import { languageAssist } from "@/lib/ai/functions";
import { labelFor } from "@/lib/ai/guardrails";
import { handle } from "@/lib/ai/http";

const MAX_TEXT_CHARS = 10_000;
const MAX_LANGUAGE_NAME_CHARS = 60;
const Body = z.object({
  text: z.string().min(1).max(MAX_TEXT_CHARS),
  mode: z.enum(["grammar", "translate"]),
  sourceLanguage: z.string().max(MAX_LANGUAGE_NAME_CHARS).optional(),
  targetLanguage: z.string().max(MAX_LANGUAGE_NAME_CHARS).optional(),
});

export const POST = handle(
  Body,
  (input) => languageAssist(input),
  ({ text, mode, sourceLanguage }) => ({ text, label: labelFor(mode, sourceLanguage) }),
);
