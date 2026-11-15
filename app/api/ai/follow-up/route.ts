import { z } from "zod";
import { nextFollowUpQuestion } from "@/lib/ai/functions";
import { handle } from "@/lib/ai/http";
import { mockNextFollowUpQuestion } from "@/lib/ai/mock";

const MAX_STORY_CHARS = 10_000;
const MAX_TURN_CHARS = 2_000;
const MAX_TURNS = 20;
const Turn = z.object({ question: z.string().max(MAX_TURN_CHARS), answer: z.string().max(MAX_TURN_CHARS) });
const Body = z.object({
  storyBody: z.string().min(1).max(MAX_STORY_CHARS),
  history: z.array(Turn).max(MAX_TURNS),
});

export const POST = handle(
  Body,
  (input) => nextFollowUpQuestion(input),
  ({ history }) => mockNextFollowUpQuestion(history),
);
