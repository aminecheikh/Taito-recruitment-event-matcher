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

export const MAX_SEARCH_REASON_WORDS = 25;
const MAX_INTERPRETATION_LENGTH = 400;
const MAX_SEARCH_GROUPS = 10;

/** One group of the AI search as the UI gets it: real applicant ids, a reason per applicant. */
export type SearchGroup = { label: string; applicant_ids: string[]; reason_per_applicant: Record<string, string> };
export type SearchResult = { interpretation: string; groups: SearchGroup[] };
/** What the model returns: aliases (A1, A2, ...) instead of applicant ids. */
export type RawSearchResult = {
  interpretation: string;
  groups: { label: string; applicants: { id: string; reason: string }[] }[];
};

function capWords(text: string, max: number): string {
  const words = text.split(/\s+/);
  return words.length <= max ? text : `${words.slice(0, max).join(" ")}…`;
}

function cleanGroup(group: RawSearchResult["groups"][number], aliases: Readonly<Record<string, string>>): SearchGroup | null {
  const label = group.label.trim();
  if (!label || SCORES_A_PERSON.test(label)) return null;
  const reasons = new Map<string, string>();
  for (const { id, reason } of group.applicants) {
    const applicantId = Object.hasOwn(aliases, id) ? aliases[id] : undefined;
    const text = reason.trim();
    if (!applicantId || reasons.has(applicantId) || !text || SCORES_A_PERSON.test(text)) continue;
    reasons.set(applicantId, capWords(text, MAX_SEARCH_REASON_WORDS));
  }
  if (reasons.size === 0) return null;
  return { label, applicant_ids: [...reasons.keys()], reason_per_applicant: Object.fromEntries(reasons) };
}

/**
 * Maps aliases back to applicant ids and drops unknown ids, duplicates, empty groups and anything that
 * scores a person. Returns null (caller falls back) when the interpretation is missing or too long, or
 * when it scores people while still returning groups. An answer with no groups is valid: it is how the
 * model says the request cannot be answered from the cards.
 */
export function cleanSearchResult(raw: RawSearchResult, aliases: Readonly<Record<string, string>>): SearchResult | null {
  const interpretation = raw.interpretation.trim();
  if (!interpretation || interpretation.length > MAX_INTERPRETATION_LENGTH) return null;
  const groups = raw.groups
    .map((g) => cleanGroup(g, aliases))
    .filter((g): g is SearchGroup => g !== null)
    .slice(0, MAX_SEARCH_GROUPS);
  if (groups.length > 0 && SCORES_A_PERSON.test(interpretation)) return null;
  return { interpretation, groups };
}

export function labelFor(mode: "grammar" | "translate", sourceLanguage?: string): LanguageLabel {
  return mode === "grammar"
    ? "language edited"
    : `translated from ${sourceLanguage ?? UNKNOWN_LANGUAGE}`;
}
