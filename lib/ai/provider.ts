import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export const DEFAULT_MODEL_BY_PROVIDER = {
  google: "gemini-3.8-flash",
  anthropic: "claude-sonnet-5-5",
  openai: "gpt-5.4-mini",
} as const;

type RealProvider = keyof typeof DEFAULT_MODEL_BY_PROVIDER;

function isRealProvider(name: string): name is RealProvider {
  return name in DEFAULT_MODEL_BY_PROVIDER;
}

/** Returns null when AI_PROVIDER is mock (the default), unknown, or the provider key is missing. */
export function getModel(): LanguageModel | null {
  const provider = process.env.AI_PROVIDER ?? "mock";
  if (!isRealProvider(provider)) return null;
  const modelId = process.env.AI_MODEL || DEFAULT_MODEL_BY_PROVIDER[provider];

  if (provider === "google") {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    return apiKey ? createGoogleGenerativeAI({ apiKey })(modelId) : null;
  }
  if (provider === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    return apiKey ? createAnthropic({ apiKey })(modelId) : null;
  }
  const apiKey = process.env.OPENAI_API_KEY;
  return apiKey ? createOpenAI({ apiKey })(modelId) : null;
}
