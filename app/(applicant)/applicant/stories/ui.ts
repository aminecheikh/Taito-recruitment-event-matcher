import { z } from "zod";
import { LanguageLabelSchema } from "@/lib/domain/types";

const SourceSchema = z.enum(["model", "mock", "mock-fallback"]);
export const FollowUpResponseSchema = z.object({ value: z.string().min(1), source: SourceSchema });
export const LanguageResponseSchema = z.object({
  value: z.object({ text: z.string().min(1), label: LanguageLabelSchema }),
  source: SourceSchema,
});

export const buttonClass = "btn";
export const primaryClass = "btn btn-primary";
export const fieldClass = "field";
export const EXAMPLE_MODE_NOTICE = "Example mode — no real AI is connected";
export const FALLBACK_NOTICE = "AI unavailable — showing example";
