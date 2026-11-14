import { z } from "zod";
import { nextFollowUpQuestion } from "@/lib/ai/functions";
import { handle } from "@/lib/ai/http";
import { mockNextFollowUpQuestion } from "@/lib/ai/mock";

const Body = z.object({
  storyBody: z.string().min(1),
  history: z.array(z.object({ question: z.string(), answer: z.string() })),
});

export const POST = handle(
  Body,
  (input) => nextFollowUpQuestion(input),
  ({ history }) => mockNextFollowUpQuestion(history),
);
