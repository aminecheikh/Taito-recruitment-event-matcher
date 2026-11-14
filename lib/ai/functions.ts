import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import type { LanguageLabel, Requirement, Story } from "@/lib/domain/types";
import {
  cleanLanguageText,
  cleanLinkSuggestions,
  cleanQuestion,
  cleanRequirementPhrases,
  labelFor,
  type LinkSuggestion,
} from "./guardrails";
import {
  mockExtractRequirements,
  mockNextFollowUpQuestion,
  mockSuggestLinks,
} from "./mock";
import * as extractPrompt from "./prompts/extractRequirements";
import * as followUpPrompt from "./prompts/nextFollowUpQuestion";
import * as languagePrompt from "./prompts/languageAssist";
import * as linksPrompt from "./prompts/suggestLinks";
import { getModel } from "./provider";

export type { LinkSuggestion } from "./guardrails";
export type AiSource = "model" | "mock" | "mock-fallback";
export type AiResult<T> = { value: T; source: AiSource };

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
  system: string,
  prompt: string,
): Promise<z.infer<S>> {
  const { output } = await generateText({
    model,
    system,
    prompt,
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
          extractPrompt.system,
          extractPrompt.buildUser({ jobAd }),
        );
        const cleaned = cleanRequirementPhrases(requirements);
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
        const { question } = await generate(
          model,
          QuestionSchema,
          followUpPrompt.system,
          followUpPrompt.buildUser(input),
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
        const { suggestions } = await generate(
          model,
          SuggestionsSchema,
          linksPrompt.system,
          linksPrompt.buildUser({ storyBody: input.story.body, requirements: input.requirements }),
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
    return resolve(
      async (model) => {
        const { text } = await generate(
          model,
          TextSchema,
          languagePrompt.system,
          languagePrompt.buildUser(input),
        );
        const cleaned = cleanLanguageText(text, input.text);
        return cleaned ? { text: cleaned, label } : null;
      },
      () => ({ text: input.text, label }),
    );
  }

  return { extractRequirements, nextFollowUpQuestion, suggestLinks, languageAssist };
}

export const { extractRequirements, nextFollowUpQuestion, suggestLinks, languageAssist } =
  createAiFunctions(getModel);
