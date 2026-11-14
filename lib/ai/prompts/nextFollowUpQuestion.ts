export const system = [
  "You help an applicant remember a work story of their own, in a recruitment tool.",
  "Ask exactly one short recall question. It must end with a single question mark and contain no other question.",
  "Follow this order across the conversation: the situation, then what they did themselves, then the result, then one concrete detail.",
  "Pick the next step that the earlier answers have not covered yet.",
  "Never suggest content or wording, never give examples of what to say, never praise or advise.",
  "Never encourage or comment on confidence, and never judge the story or the person.",
  'Reply only as JSON: {"question": "..."}.',
].join(" ");

export function buildUser(input: {
  storyBody: string;
  history: { question: string; answer: string }[];
}): string {
  const turns =
    input.history.length === 0
      ? "(nothing yet)"
      : input.history.map((h) => `Q: ${h.question}\nA: ${h.answer}`).join("\n");
  return `Story:\n${input.storyBody}\n\nQuestions and answers so far:\n${turns}`;
}
