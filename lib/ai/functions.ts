import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import type { LanguageLabel, Requirement, Story } from "@/lib/domain/types";
import {
  cleanCvSuggestions,
  cleanLanguageText,
  cleanLinkSuggestions,
  cleanQuestion,
  cleanExtractedRequirements,
  cleanSearchResult,
  cleanSuggestedFilters,
  labelFor,
  type CvSuggestions,
  type ExtractedRequirement,
  type LinkSuggestion,
  type SearchResult,
  type SuggestedFilter,
} from "./guardrails";
import {
  mockCvSuggestions,
  mockExtractRequirements,
  mockNextFollowUpQuestion,
  mockNextRecruiterQuestion,
  mockSuggestLinks,
} from "./mock";
import * as cvPrompt from "./prompts/cvSuggestions";
import * as extractPrompt from "./prompts/extractRequirements";
import * as followUpPrompt from "./prompts/nextFollowUpQuestion";
import * as recruiterPrompt from "./prompts/recruiterFollowUpQuestion";
import * as languagePrompt from "./prompts/languageAssist";
import * as linksPrompt from "./prompts/suggestLinks";
import * as searchPrompt from "./prompts/searchApplicants";
import * as suggestFiltersPrompt from "./prompts/suggestFilters";
import { getModel } from "./provider";
import type { SearchInput } from "./searchInput";

export type { CvSuggestions, ExtractedRequirement, LinkSuggestion, SearchResult, SuggestedFilter } from "./guardrails";
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
const CvSuggestionsSchema = z.object({
  storyStarts: z.array(z.object({ excerpt: z.string(), question: z.string() })),
  relevant: z.array(z.object({ requirementId: z.string(), excerpt: z.string() })),
});
const TextSchema = z.object({ text: z.string() });
const SearchSchema = z.object({
  interpretation: z.string().describe("One sentence restating what was looked for"),
  groups: z.array(
    z.object({
      label: z.string().describe("What the group's cards have or lack as evidence, never a quality judgment"),
      applicants: z.array(
        z.object({
          id: z.string().describe("An applicant id from the input, e.g. A1"),
          reason: z.string().describe("At most 25 words, quoting the applicant's card"),
        }),
      ),
    }),
  ),
});

const SuggestFiltersSchema = z.object({
  suggested_filters: z.array(
    z.object({
      label: z.string().describe("At most 6 words, the evidence the filter checks, never a quality judgment"),
      description: z.string().describe("At most 20 words, what this filter checks"),
      applicants: z.array(
        z.object({
          id: z.string().describe("An applicant id from the input, e.g. A1"),
          reason: z.string().describe("At most 25 words, quoting the applicant's card"),
        }),
      ),
    }),
  ),
});
// Fewer than this many cards cannot be split usefully.
const MIN_CARDS_FOR_SUGGESTIONS = 2;

/** No AI connected, rate limited or failed: the UI says so and keeps the full list. */
export const NO_SEARCH_RESULT: SearchResult = { interpretation: "", groups: [] };
const EMPTY_LIST_RESULT: SearchResult = { interpretation: "There are no applicants in the current list to search.", groups: [] };

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
// The search reads every card on the list, so it gets the long timeout too.
const aiSearchTimeoutMs = () => timeoutFromEnv("AI_SEARCH_TIMEOUT_MS", DEFAULT_AI_EXTRACT_TIMEOUT_MS);

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
    if (value === null) console.warn("[ai] model reply was rejected by the guardrails; showing the example");
    return value === null ? { value: null, source: "mock-fallback" } : { value, source: "model" };
  } catch (error) {
    // Server log only, so a failed call is diagnosable from the dev-server terminal. Provider errors carry no key.
    const reason = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    console.warn(`[ai] model call failed; showing the example. ${reason}`);
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
        const dropped = requirements.filter((r) => !cleaned.some((c) => c.text === r.text.trim()));
        if (dropped.length > 0) {
          console.warn(`[ai] guardrails dropped ${dropped.length}: ${dropped.map((r) => `"${r.text}" (evidence "${r.evidence}")`).join("; ")}`);
        }
        // The model finding nothing in a vague ad is a valid answer: show none, not the ad's blurb as an example.
        if (requirements.length === 0) return [];
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

  function nextRecruiterQuestion(input: {
    requirementText: string;
    inPractice: string;
    history: { question: string; answer: string }[];
  }): Promise<AiResult<string>> {
    return resolve(
      async (model) => {
        const { question } = await generate(
          model,
          QuestionSchema,
          recruiterPrompt.system,
          recruiterPrompt.buildUser(input),
        );
        return cleanQuestion(question, input.inPractice);
      },
      () => mockNextRecruiterQuestion(input.history),
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

  function cvSuggestions(input: {
    cvText: string;
    requirements: Pick<Requirement, "id" | "companyId" | "text" | "inPractice">[];
  }): Promise<AiResult<CvSuggestions>> {
    return resolve(
      async (model) => {
        const raw = await generate(
          model,
          CvSuggestionsSchema,
          cvPrompt.system,
          cvPrompt.buildUser(input),
        );
        const cleaned = cleanCvSuggestions(raw, input.cvText, input.requirements);
        return cleaned.storyStarts.length + cleaned.relevant.length > 0 ? cleaned : null;
      },
      () => mockCvSuggestions(input.cvText, input.requirements),
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

  async function searchApplicants(input: SearchInput): Promise<AiResult<SearchResult>> {
    if (input.cards.length === 0) return { value: EMPTY_LIST_RESULT, source: "model" };
    return resolve(
      async (model) => {
        const raw = await generate(model, SearchSchema, searchPrompt.system, searchPrompt.buildUser(input), aiSearchTimeoutMs());
        return cleanSearchResult(raw, input.aliases);
      },
      () => NO_SEARCH_RESULT,
    );
  }

  /** 5-10 filters the recruiter may apply, each with its matching applicants; [] when there is nothing to split. */
  async function suggestFilters(input: SearchInput): Promise<AiResult<SuggestedFilter[]>> {
    if (input.cards.length < MIN_CARDS_FOR_SUGGESTIONS) return { value: [], source: "model" };
    return resolve(
      async (model) => {
        const raw = await generate(
          model,
          SuggestFiltersSchema,
          suggestFiltersPrompt.system,
          suggestFiltersPrompt.buildUser(input),
          aiSearchTimeoutMs(),
        );
        const cleaned = cleanSuggestedFilters(raw, input.aliases, input.cards.length);
        if (cleaned.length < raw.suggested_filters.length) {
          console.warn(`[ai] guardrails dropped ${raw.suggested_filters.length - cleaned.length} suggested filter(s)`);
        }
        return cleaned;
      },
      () => [],
    );
  }

  return { extractRequirements, nextFollowUpQuestion, nextRecruiterQuestion, suggestLinks, cvSuggestions, languageAssist, searchApplicants, suggestFilters };
}

export const { extractRequirements, nextFollowUpQuestion, nextRecruiterQuestion, suggestLinks, cvSuggestions, languageAssist, searchApplicants, suggestFilters } =
  createAiFunctions(getModel);
