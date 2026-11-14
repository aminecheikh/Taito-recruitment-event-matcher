import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import type { LanguageLabel, Requirement, Story } from "@/lib/domain/types";
import {
  cleanLanguageText,
  cleanLinkSuggestions,
  cleanQuestion,
  cleanExtractedRequirements,
  labelFor,
  type ExtractedRequirement,
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

export type { ExtractedRequirement, LinkSuggestion } from "./guardrails";
export type AiSource = "model" | "mock" | "mock-fallback";
export type AiResult<T> = { value: T; source: AiSource };

// The descriptions travel with the JSON schema sent to the model, so the format rules sit next to each field.
const RequirementsSchema = z.object({
  requirements: z
    .array(
      z.object({
        text: z
          .string()
          .describe("Requirement name: a noun phrase of at most 10 words, never a copied duty sentence"),
        inPractice: z
          .string()
          .describe('What it looks like in this job, at most 2 sentences and 45 words; "" if the name is clear'),
        evidence: z.string().describe("A phrase of at most 15 words copied exactly from the job ad"),
      }),
    )
    .describe("4 to 10 requirements in the order the ad brings them up, at most 15"),
});
const QuestionSchema = z.object({ question: z.string() });
const SuggestionsSchema = z.object({
  suggestions: z.array(z.object({ requirementId: z.string(), reason: z.string() })),
});
const TextSchema = z.object({ text: z.string() });

const DEFAULT_AI_TIMEOUT_MS = 8000;
// Extraction reads a whole job ad and returns up to 15 requirements with notes; real models need ~10-20 s for a long ad.
const DEFAULT_AI_EXTRACT_TIMEOUT_MS = 30000;
const MAX_RETRIES = 1;

function timeoutFromEnv(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const aiTimeoutMs = () => timeoutFromEnv("AI_TIMEOUT_MS", DEFAULT_AI_TIMEOUT_MS);
const aiExtractTimeoutMs = () => timeoutFromEnv("AI_EXTRACT_TIMEOUT_MS", DEFAULT_AI_EXTRACT_TIMEOUT_MS);

type GetModel = () => LanguageModel | null;

async function generate<S extends z.ZodType>(
  model: LanguageModel,
  schema: S,
  system: string,
  prompt: string,
  timeoutMs: number = aiTimeoutMs(),
): Promise<z.infer<S>> {
  const { output } = await generateText({
    model,
    system,
    prompt,
    output: Output.object({ schema }),
    abortSignal: AbortSignal.timeout(timeoutMs),
    maxRetries: MAX_RETRIES,
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

  function extractRequirements(jobAd: string): Promise<AiResult<ExtractedRequirement[]>> {
    return resolve(
      async (model) => {
        const { requirements } = await generate(
          model,
          RequirementsSchema,
          extractPrompt.system,
          extractPrompt.buildUser({ jobAd }),
          aiExtractTimeoutMs(),
        );
        const cleaned = cleanExtractedRequirements(requirements, jobAd);
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
        return cleanQuestion(question, input.storyBody);
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
