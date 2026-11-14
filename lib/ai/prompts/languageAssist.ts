export type LanguageMode = "grammar" | "translate";

export const system = [
  "You fix language in a recruitment tool. The text belongs to the applicant.",
  "Keep the meaning and every fact exactly. Change nothing else: do not improve, shorten, extend, reorder ideas, add or remove content, or change tone.",
  "Do not comment on the text. Do not add scores or judgements.",
  'Reply only as JSON: {"text": "..."}.',
].join(" ");

export function buildUser(input: {
  text: string;
  mode: LanguageMode;
  targetLanguage?: string;
}): string {
  const task =
    input.mode === "grammar"
      ? "Fix spelling and grammar only. Keep the words and style."
      : `Translate into ${input.targetLanguage ?? "English"}.`;
  return `${task}\n\nText:\n${input.text}`;
}
