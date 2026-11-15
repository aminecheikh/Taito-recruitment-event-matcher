import { z } from "zod";
import { nextRecruiterQuestion } from "@/lib/ai/functions";
import { judgesPeople, REFUSAL_MESSAGE } from "@/lib/ai/guardrails";
import { handle } from "@/lib/ai/http";
import { mockNextRecruiterQuestion } from "@/lib/ai/mock";

const Body = z.object({
  requirementText: z.string().min(1),
  inPractice: z.string(),
  history: z.array(z.object({ question: z.string(), answer: z.string() })),
});

export const POST = handle(
  Body,
  (input) => nextRecruiterQuestion(input),
  ({ history }) => mockNextRecruiterQuestion(history),
  (input) =>
    input.history.some((turn) => judgesPeople(turn.answer))
      ? { kind: "refuse", error: "judges-people", message: REFUSAL_MESSAGE }
      : { kind: "ok", input },
);
