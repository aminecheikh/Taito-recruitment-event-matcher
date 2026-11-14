import type { LanguageLabel } from "@/lib/domain/types";

export const MAX_LINK_SUGGESTIONS = 3;
export const MAX_REASON_LENGTH = 240;
export const MAX_QUESTION_LENGTH = 200;
const UNKNOWN_LANGUAGE = "another language";
const SCORING_LANGUAGE = /\d+\s*%|\bscore\b|\brating\b|\brank|\bbest match\b/i;

export type LinkSuggestion = { requirementId: string; reason: string };

export function cleanLinkSuggestions(
  suggestions: readonly LinkSuggestion[],
  requirements: readonly { id: string }[],
): LinkSuggestion[] {
  const known = new Set(requirements.map((r) => r.id));
  const seen = new Set<string>();
  return suggestions
    .map((s) => ({ requirementId: s.requirementId, reason: s.reason.trim() }))
    .filter((s) => {
      const valid =
        known.has(s.requirementId) &&
        !seen.has(s.requirementId) &&
        s.reason.length > 0 &&
        s.reason.length <= MAX_REASON_LENGTH &&
        !SCORING_LANGUAGE.test(s.reason);
      if (valid) seen.add(s.requirementId);
      return valid;
    })
    .slice(0, MAX_LINK_SUGGESTIONS);
}

export function cleanQuestion(text: string): string | null {
  const trimmed = text.trim();
  const questionMarks = trimmed.split("?").length - 1;
  const valid = questionMarks === 1 && trimmed.endsWith("?") && trimmed.length <= MAX_QUESTION_LENGTH;
  return valid ? trimmed : null;
}

export function labelFor(mode: "grammar" | "translate", sourceLanguage?: string): LanguageLabel {
  return mode === "grammar"
    ? "language edited"
    : `translated from ${sourceLanguage ?? UNKNOWN_LANGUAGE}`;
}
