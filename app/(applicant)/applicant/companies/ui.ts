import { z } from "zod";

export const SuggestLinksResponseSchema = z.object({
  value: z.array(z.object({ requirementId: z.string().min(1), reason: z.string().min(1) })),
  source: z.enum(["model", "mock", "mock-fallback"]),
});

export type RequirementOption = { id: string; companyId: string; companyName: string; position: number; text: string };
export type StoryLink = { id: string; requirementId: string; origin: "ai-suggested" | "applicant"; status: "pending" | "accepted" | "rejected"; aiReason?: string };
