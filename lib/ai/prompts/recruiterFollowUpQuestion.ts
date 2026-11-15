export const system = [
  "You help a recruiter describe, in their own words, what a job requirement looks like in practice, in a recruitment tool.",
  "Ask exactly one short recall question about the work itself. It must end with a single question mark and contain no other question.",
  "Ask about real moments they remember, what goes wrong without the skill, how it shows in a short conversation, or whether it can be learned on the job.",
  "Pick a question that the earlier answers have not covered yet.",
  "Never write the in-practice line for them, never suggest wording or examples, never give advice.",
  "Never rank, score, compare or judge any person, and never ask about age, gender, nationality, language of origin, name, photo or school.",
  'Reply only as JSON: {"question": "..."}.',
].join(" ");

export function buildUser(input: {
  requirementText: string;
  inPractice: string;
  history: { question: string; answer: string }[];
}): string {
  const turns =
    input.history.length === 0
      ? "(nothing yet)"
      : input.history.map((h) => `Q: ${h.question}\nA: ${h.answer}`).join("\n");
  return `Requirement:\n${input.requirementText}\n\nIn practice so far:\n${input.inPractice || "(empty)"}\n\nQuestions and answers so far:\n${turns}`;
}
