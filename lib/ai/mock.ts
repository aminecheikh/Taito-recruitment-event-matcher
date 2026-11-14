import type { Requirement } from "@/lib/domain/types";
import type { LinkSuggestion } from "./guardrails";

const MAX_EXTRACTED_REQUIREMENTS = 15;
const DEMO_STORY_MARKER = "ticket reader";
const DEMO_LINKS: readonly LinkSuggestion[] = [
  {
    requirementId: "req-01-1",
    reason: 'You wrote "traced a fault", which sounds like the debugging this requirement describes.',
  },
  {
    requirementId: "req-01-3",
    reason: 'You wrote "got the supplier to fix it", which sounds like working with suppliers.',
  },
];

// Applicant-facing recall questions from docs/research/03-psychology-methods.md (question bank).
export const FOLLOW_UP_LADDER: readonly string[] = [
  "Where were you and what was needed?",
  "What exactly did you do yourself, as opposed to the team?",
  "What happened as a result, and how do you know?",
  "Take yourself back to that day. What was the first thing you noticed?",
  "What was the hardest moment in that story, and what did you try first?",
  "What did you learn that you do differently now?",
];

export function mockExtractRequirements(jobAd: string): string[] {
  return jobAd
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, MAX_EXTRACTED_REQUIREMENTS);
}

export function mockNextFollowUpQuestion(history: readonly unknown[]): string {
  return FOLLOW_UP_LADDER[Math.min(history.length, FOLLOW_UP_LADDER.length - 1)];
}

export function mockSuggestLinks(
  storyBody: string,
  requirements: readonly Pick<Requirement, "id">[],
): LinkSuggestion[] {
  if (!storyBody.toLowerCase().includes(DEMO_STORY_MARKER)) return [];
  const present = new Set(requirements.map((r) => r.id));
  return DEMO_LINKS.filter((link) => present.has(link.requirementId));
}
