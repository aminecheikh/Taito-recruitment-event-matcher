import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import type { LanguageLabel, Requirement, Story } from "@/lib/domain/types";
import {
  cleanLinkSuggestions,
  cleanQuestion,
  labelFor,
  type LinkSuggestion,
} from "./guardrails";
import {
  mockExtractRequirements,
  mockNextFollowUpQuestion,
  mockSuggestLinks,
} from "./mock";
import { getModel } from "./provider";

export type { LinkSuggestion } from "./guardrails";
export type AiSource = "model" | "mock" | "mock-fallback";
export type AiResult<T> = { value: T; source: AiSource };

const MAX_REQUIREMENT_PHRASES = 15;

const RULES =
  "You are a helper in a recruitment tool. You never write, rewrite or improve an applicant's content, " +
  "and you never score, rank, rate or judge people. Reply only in the requested JSON shape.";

const RequirementsSchema = z.object({ requirements: z.array(z.string()) });
const QuestionSchema = z.object({ question: z.string() });
const SuggestionsSchema = z.object({
  suggestions: z.array(z.object({ requirementId: z.string(), reason: z.string() })),
});
const TextSchema = z.object({ text: z.string() });

type GetModel = () => LanguageModel | null;

async function generate<S extends z.ZodType>(
  model: LanguageModel,
  schema: S,
  instruction: string,
): Promise<z.infer<S>> {
  const { output } = await generateText({
    model,
    system: RULES,
    prompt: instruction,
    output: Output.object({ schema }),
  });
  return schema.parse(output);
}

/** Runs the model path; returns null when the model is absent, throws, or its output is rejected. */
async function tryModel<T>(
  model: LanguageModel | null,
  run: (model: LanguageModel) => Promise<T | null>,
): Promise<{ value: T; source: "model" } | { value: null; source: "mock" | "mock-fallback" }> {
  if (!model) return { value: null, source: "mock" };
  try {
    const value = await run(model);
    return value === null ? { value: null, source: "mock-fallback" } : { value, source: "model" };
  } catch {
    return { value: null, source: "mock-fallback" };
  }
}

export function createAiFunctions(getModelFn: GetModel) {
  async function resolve<T>(
    run: (model: LanguageModel) => Promise<T | null>,
    mock: () => T,
  ): Promise<AiResult<T>> {
    const attempt = await tryModel(getModelFn(), run);
    return attempt.value === null
      ? { value: mock(), source: attempt.source }
      : { value: attempt.value, source: "model" };
  }

  function extractRequirements(jobAd: string): Promise<AiResult<string[]>> {
    return resolve(
      async (model) => {
        const { requirements } = await generate(
          model,
          RequirementsSchema,
          `List the requirements in this job ad as short phrases, at most ${MAX_REQUIREMENT_PHRASES}. Copy the ad's wording; do not add any.\n\n${jobAd}`,
        );
        const cleaned = requirements.map((r) => r.trim()).filter(Boolean).slice(0, MAX_REQUIREMENT_PHRASES);
        return cleaned.length > 0 ? cleaned : null;
      },
      () => mockExtractRequirements(jobAd),
    );
  }

  function nextFollowUpQuestion(input: {
    storyBody: string;
    history: { question: string; answer: string }[];
  }): Promise<AiResult<string>> {
    return resolve(
      async (model) => {
        const turns = input.history.map((h) => `Q: ${h.question}\nA: ${h.answer}`).join("\n");
        const { question } = await generate(
          model,
          QuestionSchema,
          `Ask the applicant exactly one short recall question about their story (what they did, who was there, what happened). Do not praise, advise or suggest wording.\n\nStory:\n${input.storyBody}\n\nSo far:\n${turns}`,
        );
        return cleanQuestion(question);
      },
      () => mockNextFollowUpQuestion(input.history),
    );
  }

  function suggestLinks(input: {
    story: Pick<Story, "id" | "body">;
    requirements: Pick<Requirement, "id" | "companyId" | "text" | "inPractice">[];
  }): Promise<AiResult<LinkSuggestion[]>> {
    return resolve(
      async (model) => {
        const list = input.requirements.map((r) => `${r.id}: ${r.text} (${r.inPractice})`).join("\n");
        const { suggestions } = await generate(
          model,
          SuggestionsSchema,
          `Suggest at most 3 requirements this story could be evidence for. Give each a one-sentence reason quoting the story's own words. No scores or ratings.\n\nStory:\n${input.story.body}\n\nRequirements:\n${list}`,
        );
        const cleaned = cleanLinkSuggestions(suggestions, input.requirements);
        return cleaned.length > 0 ? cleaned : null;
      },
      () => mockSuggestLinks(input.story.body, input.requirements),
    );
  }

  function languageAssist(input: {
    text: string;
    mode: "grammar" | "translate";
    sourceLanguage?: string;
    targetLanguage?: string;
  }): Promise<AiResult<{ text: string; label: LanguageLabel }>> {
    const label = labelFor(input.mode, input.sourceLanguage);
    const task =
      input.mode === "grammar"
        ? "Fix spelling and grammar only. Keep the meaning, words and style."
        : `Translate into ${input.targetLanguage ?? "English"}. Keep the meaning exactly.`;
    return resolve(
      async (model) => {
        const { text } = await generate(model, TextSchema, `${task}\n\n${input.text}`);
        return text.trim() ? { text, label } : null;
      },
      () => ({ text: input.text, label }),
    );
  }

  return { extractRequirements, nextFollowUpQuestion, suggestLinks, languageAssist };
}

export const { extractRequirements, nextFollowUpQuestion, suggestLinks, languageAssist } =
  createAiFunctions(getModel);
