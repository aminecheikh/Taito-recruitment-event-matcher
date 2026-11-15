import { z } from "zod";
import { nextRecruiterQuestion } from "@/lib/ai/functions";
import { judgesPeople, REFUSAL_MESSAGE } from "@/lib/ai/guardrails";
import { handle } from "@/lib/ai/http";
import { mockNextRecruiterQuestion } from "@/lib/ai/mock";

const MAX_FIELD_CHARS = 2_000;
const MAX_TURNS = 20;
const Turn = z.object({ question: z.string().max(MAX_FIELD_CHARS), answer: z.string().max(MAX_FIELD_CHARS) });
const Body = z.object({
  requirementText: z.string().min(1).max(MAX_FIELD_CHARS),
  inPractice: z.string().max(MAX_FIELD_CHARS),
  history: z.array(Turn).max(MAX_TURNS),
});

/** Everything the recruiter typed. The questions in history are the AI's own, so they are not checked. */
const typedByRecruiter = (input: z.infer<typeof Body>) => [input.requirementText, input.inPractice, ...input.history.map((t) => t.answer)];

export const POST = handle(
  Body,
  (input) => nextRecruiterQuestion(input),
  ({ history }) => mockNextRecruiterQuestion(history),
  (input) =>
    typedByRecruiter(input).some(judgesPeople)
      ? { kind: "refuse", error: "judges-people", message: REFUSAL_MESSAGE }
      : { kind: "ok", input },
);
