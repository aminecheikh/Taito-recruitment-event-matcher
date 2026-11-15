import type { Requirement } from "@/lib/domain/types";
import type { CvSuggestions, ExtractedRequirement, LinkSuggestion } from "./guardrails";

const DEMO_CV_MARKER = "bus depot (fictional)";
const MOCK_CV_STORY_STARTS = 3;
const DEMO_CV_SUGGESTIONS: CvSuggestions = {
  storyStarts: [
    {
      excerpt: "Traced a fault in the ticket readers that froze one bus in five after an overnight update",
      question: "What happened when you traced the fault in the ticket readers?",
    },
    {
      excerpt: "Got the supplier to fix a firmware timing issue",
      question: "What happened when you went to the supplier with the firmware issue?",
    },
    {
      excerpt: "Explained the update problem to the depot managers in plain language",
      question: "What happened when you explained the update problem to the depot managers?",
    },
  ],
  relevant: [
    { requirementId: "req-01-1", excerpt: "Traced a fault in the ticket readers" },
    { requirementId: "req-01-2", excerpt: "Explained the update problem to the depot managers in plain language" },
    { requirementId: "req-01-3", excerpt: "Got the supplier to fix a firmware timing issue" },
    { requirementId: "req-01-4", excerpt: "Wrote a small Python script that sorts the freeze log" },
  ],
};

/** Scripted for demo-cv-017.txt; otherwise the first bullet lines become "What happened when you ...?" questions. */
export function mockCvSuggestions(
  cvText: string,
  requirements: readonly Pick<Requirement, "id">[],
): CvSuggestions {
  if (cvText.includes(DEMO_CV_MARKER)) {
    const present = new Set(requirements.map((r) => r.id));
    return { ...DEMO_CV_SUGGESTIONS, relevant: DEMO_CV_SUGGESTIONS.relevant.filter((r) => present.has(r.requirementId)) };
  }
  const bullets = cvText
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*(?:[-*•]|\d+[.)])\s*(.+?)\s*$/)?.[1] ?? "")
    .filter((line) => line.length > 0)
    .slice(0, MOCK_CV_STORY_STARTS);
  return {
    storyStarts: bullets.map((excerpt) => ({
      excerpt,
      question: `What happened when you ${excerpt.charAt(0).toLowerCase()}${excerpt.slice(1).replace(/[?.!]+$/, "")}?`,
    })),
    relevant: [],
  };
}

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

/** Offline stand-in: one requirement per line of the ad, no inPractice note. */
export function mockExtractRequirements(jobAd: string): ExtractedRequirement[] {
  return jobAd
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim())
    .filter((line) => line.length > 0)
    .slice(0, MAX_EXTRACTED_REQUIREMENTS)
    .map((text) => ({ text, inPractice: "" }));
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
