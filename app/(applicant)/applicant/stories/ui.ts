import { z } from "zod";
import { LanguageLabelSchema } from "@/lib/domain/types";

const SourceSchema = z.enum(["model", "mock", "mock-fallback"]);
export const FollowUpResponseSchema = z.object({ value: z.string().min(1), source: SourceSchema });
export const LanguageResponseSchema = z.object({
  value: z.object({ text: z.string().min(1), label: LanguageLabelSchema }),
  source: SourceSchema,
});

export const buttonClass =
  "min-h-11 rounded border border-neutral-700 bg-white px-3 text-sm text-neutral-900 disabled:cursor-not-allowed disabled:border-neutral-400 disabled:text-neutral-500";
export const primaryClass =
  "min-h-11 rounded bg-neutral-900 px-4 text-sm font-medium text-white disabled:bg-neutral-600";
export const fieldClass = "w-full rounded border border-neutral-700 bg-white px-3 py-2 text-neutral-900";
export const FALLBACK_NOTICE = "AI unavailable — showing example";
