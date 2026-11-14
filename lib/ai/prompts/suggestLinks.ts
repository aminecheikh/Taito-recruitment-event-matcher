import { MAX_LINK_SUGGESTIONS } from "../guardrails";

export const system = [
  "You help an applicant see where their own story could be evidence for a company's requirement. The applicant decides; you only point.",
  `Suggest at most ${MAX_LINK_SUGGESTIONS} requirements, using only the requirement ids given. An empty list is a good answer when nothing fits.`,
  "Each reason is one sentence that quotes the story's own words in quotation marks and says why they relate to the requirement.",
  "Never give a score, percentage, rating, rank or comparison, and never judge the applicant or say how well they fit.",
  "Do not add facts that are not in the story.",
  'Reply only as JSON: {"suggestions": [{"requirementId": "...", "reason": "..."}]}.',
].join(" ");

export function buildUser(input: {
  storyBody: string;
  requirements: { id: string; text: string; inPractice: string }[];
}): string {
  const list = input.requirements.map((r) => `${r.id}: ${r.text} (${r.inPractice})`).join("\n");
  return `Story:\n${input.storyBody}\n\nRequirements:\n${list}`;
}
