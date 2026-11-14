import type { LanguageLabel } from "@/lib/domain/types";

export const MAX_LINK_SUGGESTIONS = 3;
export const MAX_REASON_LENGTH = 240;
export const MAX_QUESTION_LENGTH = 200;
const UNKNOWN_LANGUAGE = "another language";
const SCORING_LANGUAGE = /\d+\s*%|\bscore\b|\brating\b|\brank|\bbest match\b/i;

export const MAX_REQUIREMENT_PHRASES = 15;
// A requirement phrase is dropped only when it scores, rates or ranks a person, so job content such as
// "ranked list maintenance" stays.
const PERSON_NOUN = "(?:candidates?|applicants?|persons?|people|talents?|jobseekers?)";
const SCORES_A_PERSON = new RegExp(
  `${PERSON_NOUN}\\W+(?:\\w+\\W+)?(?:score|rating|rank)|` +
    `\\b(?:score|rate|rank|rating)\\w*\\W+(?:\\w+\\W+)?(?:of\\W+)?(?:the\\W+)?${PERSON_NOUN}|` +
    `\\bbest match\\b|\\bmatch(?:ing)? (?:score|percentage)\\b`,
  "i",
);

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
  const valid =
    questionMarks === 1 &&
    trimmed.endsWith("?") &&
    trimmed.length <= MAX_QUESTION_LENGTH &&
    !SCORING_LANGUAGE.test(trimmed);
  return valid ? trimmed : null;
}

/** Language output is rejected when it is empty or adds scoring language the input did not have. */
export function cleanLanguageText(output: string, input: string): string | null {
  const trimmed = output.trim();
  if (!trimmed) return null;
  return SCORING_LANGUAGE.test(trimmed) && !SCORING_LANGUAGE.test(input) ? null : trimmed;
}

export function cleanRequirementPhrases(phrases: readonly string[]): string[] {
  return phrases
    .map((p) => p.trim())
    .filter((p) => p.length > 0 && !SCORES_A_PERSON.test(p))
    .slice(0, MAX_REQUIREMENT_PHRASES);
}

export function labelFor(mode: "grammar" | "translate", sourceLanguage?: string): LanguageLabel {
  return mode === "grammar"
    ? "language edited"
    : `translated from ${sourceLanguage ?? UNKNOWN_LANGUAGE}`;
}
