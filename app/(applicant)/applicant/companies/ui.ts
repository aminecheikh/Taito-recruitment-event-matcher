import { z } from "zod";

export const SuggestLinksResponseSchema = z.object({
  value: z.array(z.object({ requirementId: z.string().min(1), reason: z.string().min(1) })),
  source: z.enum(["model", "mock", "mock-fallback"]),
});

export type UsedFor = { companyName: string; position: number | null; text: string };
export type StoryView = { id: string; title: string; body: string };
export type RecommendationView = { linkId: string; story: StoryView; reason: string };
export type MatchView = {
  entryId: string;
  body: string;
  kind: "same" | "similar" | "other";
  sharedWords: string[];
  usedFor: UsedFor[];
};
export type AnswerView = { entryId: string; body: string; languageLabel?: string; alsoUsedFor: UsedFor[] };
export type CardView = {
  requirementId: string;
  position: number;
  text: string;
  inPractice: string;
  answer: AnswerView | null;
  matches: MatchView[];
  recommendations: RecommendationView[];
};

export const usedForLabel = (u: UsedFor) => (u.position === null ? u.companyName : `${u.companyName} #${u.position}`);
