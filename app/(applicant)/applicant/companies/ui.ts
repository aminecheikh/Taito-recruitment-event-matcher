import { z } from "zod";

export const SuggestLinksResponseSchema = z.object({
  value: z.array(z.object({ requirementId: z.string().min(1), reason: z.string().min(1) })),
  source: z.enum(["model", "mock", "mock-fallback"]),
});
