import type { LanguageLabel } from "@/lib/domain/types";

export const MAX_LINK_SUGGESTIONS = 3;
export const MAX_REASON_LENGTH = 240;
export const MAX_QUESTION_LENGTH = 200;
const UNKNOWN_LANGUAGE = "another language";
const SCORING_LANGUAGE = /\d+\s*%|\bscore\b|\brating\b|\brank|\bbest match\b/i;

export const MAX_REQUIREMENT_PHRASES = 15;
// The prompt asks for at most 45 words (~280 characters); anything longer is an essay, not a hint.
export const MAX_IN_PRACTICE_LENGTH = 350;
// A requirement phrase is dropped only when it scores, rates or ranks a person, so job content such as
// "ranked list maintenance" stays.
const PERSON_NOUN = "(?:candidates?|applicants?|persons?|people|talents?|jobseekers?|hires?|employees?)";
const SCORES_A_PERSON = new RegExp(
  `${PERSON_NOUN}\\W+(?:\\w+\\W+)?(?:score|rating|rank)|` +
    `\\b(?:score|rate|rank|rating)\\w*\\W+(?:\\w+\\W+)?(?:of\\W+)?(?:the\\W+)?${PERSON_NOUN}|` +
    `\\b(?:top|best)\\W+(?:\\w+\\W+)?${PERSON_NOUN}|` +
    `\\b(?:compar|shortlist|reject|filter)\\w*\\W+(?:\\w+\\W+)?(?:the\\W+)?${PERSON_NOUN}|` +
    `\\bfit\\W+(?:score|rating|percentage)\\b|%\\s*fit\\b|` +
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

/** Scoring language is rejected unless the applicant's own story already contains it (e.g. a quoted "30%"). */
export function cleanQuestion(text: string, storyBody: string): string | null {
  const trimmed = text.trim();
  const questionMarks = trimmed.split("?").length - 1;
  const valid =
    questionMarks === 1 &&
    trimmed.endsWith("?") &&
    trimmed.length <= MAX_QUESTION_LENGTH &&
    !(SCORING_LANGUAGE.test(trimmed) && !SCORING_LANGUAGE.test(storyBody));
  return valid ? trimmed : null;
}

/** Language output is rejected when it is empty or adds scoring language the input did not have. */
export function cleanLanguageText(output: string, input: string): string | null {
  const trimmed = output.trim();
  if (!trimmed) return null;
  return SCORING_LANGUAGE.test(trimmed) && !SCORING_LANGUAGE.test(input) ? null : trimmed;
}

/** A requirement the AI suggests from a job ad; inPractice is "" when the title explains itself. */
export type ExtractedRequirement = { text: string; inPractice: string };
/** What the model returns: the requirement plus a quote from the ad that supports it. */
export type GroundedRequirement = ExtractedRequirement & { evidence: string };

// Case, spacing, punctuation and quote styles vary between the ad and the model's copy of it.
function normalise(text: string): string {
  return ` ${(text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).join(" ")} `;
}

/** True when the quote really appears in the ad, so the item is grounded and not invented. */
export function isQuotedFrom(evidence: string, jobAd: string): boolean {
  const quote = normalise(evidence);
  return quote.trim().length > 0 && normalise(jobAd).includes(quote);
}

/**
 * Drops items whose evidence is not in the ad or that score a person, dedupes, caps, and blanks an
 * inPractice line that scores a person or runs too long. Evidence is used here only, not shown.
 */
export function cleanExtractedRequirements(
  items: readonly GroundedRequirement[],
  jobAd: string,
): ExtractedRequirement[] {
  const seen = new Set<string>();
  return items
    .filter((item) => isQuotedFrom(item.evidence, jobAd))
    .map((item) => ({ text: item.text.trim(), inPractice: item.inPractice.trim() }))
    .filter((item) => item.text.length > 0 && !SCORES_A_PERSON.test(item.text))
    .filter((item) => {
      const key = item.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((item) =>
      SCORES_A_PERSON.test(item.inPractice) || item.inPractice.length > MAX_IN_PRACTICE_LENGTH
        ? { ...item, inPractice: "" }
        : item,
    )
    .slice(0, MAX_REQUIREMENT_PHRASES);
}

export function labelFor(mode: "grammar" | "translate", sourceLanguage?: string): LanguageLabel {
  return mode === "grammar"
    ? "language edited"
    : `translated from ${sourceLanguage ?? UNKNOWN_LANGUAGE}`;
}

// Input guard: refuses job-ad text that asks the AI to judge people. These patterns are narrower than
// SCORES_A_PERSON on purpose: ad copy such as "we hire the best people" or "rating employee surveys"
// must pass, so the person noun is limited to candidates, applicants and jobseekers.
const CANDIDATE = "(?:candidates?|applicants?|jobseekers?)";
export const HIRING_DECISION =
  /\b(?:should|do|would) (?:we|i) (?:hire(?! you\b)|reject|(?:pick|choose) (?:the |this |that |which )?(?:candidate|applicant|person|one)\b)|\bwho (?:should|to) (?:hire|reject|pick)\b|\bwho is (?:the )?(?:best|strongest|top)\b/i;
const JUDGES_CANDIDATES = new RegExp(
  `${CANDIDATE}\\W+(?:\\w+\\W+)?(?:score|rating|rank)|` +
    `\\b(?:score|rate|rank)\\w*\\W+(?:\\w+\\W+)?(?:of\\W+)?(?:the\\W+)?${CANDIDATE}|` +
    `\\b(?:top|best)\\W+(?:\\w+\\W+)?${CANDIDATE}|` +
    `\\b(?:compar|shortlist|reject|filter|screen|weed)\\w*\\W+(?:out\\W+)?(?:\\w+\\W+){0,2}?${CANDIDATE}|` +
    `\\bfit\\W+(?:score|rating|percentage)\\b|%\\s*fit\\b|\\bbest match\\b|\\bmatch(?:ing)? (?:score|percentage)\\b`,
  "i",
);
export const REFUSAL_MESSAGE =
  "Taito's AI doesn't rank, score or pick people. A person decides. It can help you describe what you need.";

export function judgesPeople(text: string): boolean {
  return JUDGES_CANDIDATES.test(text) || HIRING_DECISION.test(text);
}

export type JobAdGuard = { kind: "refuse" } | { kind: "ok"; text: string; removed: number };

/** Drops the lines that ask to judge people; refuses when nothing is left to read. */
export function guardJobAd(text: string): JobAdGuard {
  const lines = text.split("\n");
  const kept = lines.filter((line) => !judgesPeople(line));
  if (kept.length === lines.length) return { kind: "ok", text, removed: 0 };
  const rest = kept.join("\n");
  if (rest.trim() === "") return { kind: "refuse" };
  return { kind: "ok", text: rest, removed: lines.length - kept.length };
}
