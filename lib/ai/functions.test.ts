import { MockLanguageModelV4 } from "ai/test";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createAiFunctions } from "./functions";

const demoStory = {
  id: "story-1",
  body: "I was the ticket reader on the line. I traced a fault to a loose cable and got the supplier to fix it.",
};
const acme = [
  { id: "req-01-1", companyId: "c1", text: "Debugging embedded systems", inPractice: "x" },
  { id: "req-01-2", companyId: "c1", text: "Writing docs", inPractice: "x" },
  { id: "req-01-3", companyId: "c1", text: "Working with suppliers", inPractice: "x" },
];

const throwingModel = new MockLanguageModelV4({
  doGenerate: async () => {
    throw new Error("provider down");
  },
});

function modelReturning(text: string) {
  return new MockLanguageModelV4({
    doGenerate: async () => ({
      content: [{ type: "text", text }],
      finishReason: { unified: "stop", raw: "stop" },
      usage: {
        inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
        outputTokens: { total: 1, text: 1, reasoning: 0 },
      },
      warnings: [],
    }),
  });
}

beforeEach(() => {
  vi.stubEnv("AI_PROVIDER", "mock");
});
afterEach(() => vi.unstubAllEnvs());

describe("mock provider", () => {
  const ai = createAiFunctions(() => null);

  test("extractRequirements splits the ad into short phrases, max 15", async () => {
    const ad = Array.from({ length: 20 }, (_, i) => `- Skill ${i}`).join("\n");
    const out = await ai.extractRequirements(ad);
    expect(out.source).toBe("mock");
    expect(out.value).toHaveLength(15);
    expect(out.value[0]).toBe("Skill 0");
  });

  test("nextFollowUpQuestion asks one recall question and walks the ladder", async () => {
    const first = await ai.nextFollowUpQuestion({ storyBody: "x", history: [] });
    const second = await ai.nextFollowUpQuestion({
      storyBody: "x",
      history: [{ question: first.value, answer: "a" }],
    });
    expect(first.source).toBe("mock");
    expect(first.value.endsWith("?")).toBe(true);
    expect(second.value).not.toBe(first.value);
  });

  test("suggestLinks returns req-01-1 and req-01-3 for the demo story", async () => {
    const out = await ai.suggestLinks({ story: demoStory, requirements: acme });
    expect(out.source).toBe("mock");
    expect(out.value.map((s) => s.requirementId)).toEqual(["req-01-1", "req-01-3"]);
    expect(out.value[0].reason).toContain("traced a fault");
    expect(out.value[1].reason).toContain("got the supplier to fix it");
  });

  test("suggestLinks only returns demo requirements that are present", async () => {
    const out = await ai.suggestLinks({ story: demoStory, requirements: [acme[0]] });
    expect(out.value.map((s) => s.requirementId)).toEqual(["req-01-1"]);
  });

  test("suggestLinks is empty for other stories", async () => {
    const out = await ai.suggestLinks({ story: { id: "s", body: "gardening" }, requirements: acme });
    expect(out.value).toEqual([]);
  });

  test("languageAssist returns text unchanged with the label", async () => {
    const out = await ai.languageAssist({ text: "hello", mode: "translate", sourceLanguage: "Finnish" });
    expect(out.value).toEqual({ text: "hello", label: "translated from Finnish" });
    const g = await ai.languageAssist({ text: "hello", mode: "grammar" });
    expect(g.value.label).toBe("language edited");
  });
});

describe("with a real model", () => {
  test("a provider that throws falls back to the mock", async () => {
    const ai = createAiFunctions(() => throwingModel);
    expect((await ai.extractRequirements("- a")).source).toBe("mock-fallback");
    expect((await ai.nextFollowUpQuestion({ storyBody: "x", history: [] })).source).toBe("mock-fallback");
    expect((await ai.suggestLinks({ story: demoStory, requirements: acme })).source).toBe("mock-fallback");
    expect((await ai.languageAssist({ text: "t", mode: "grammar" })).source).toBe("mock-fallback");
  });

  test("valid model output passes guardrails with source model", async () => {
    const ai = createAiFunctions(() =>
      modelReturning(
        JSON.stringify({ suggestions: [{ requirementId: "req-01-2", reason: "You describe writing." }, { requirementId: "nope", reason: "x" }] }),
      ),
    );
    const out = await ai.suggestLinks({ story: demoStory, requirements: acme });
    expect(out).toEqual({ source: "model", value: [{ requirementId: "req-01-2", reason: "You describe writing." }] });
  });

  test("output that guardrails reject falls back to the mock", async () => {
    const ai = createAiFunctions(() => modelReturning(JSON.stringify({ question: "Great! You led it." })));
    const out = await ai.nextFollowUpQuestion({ storyBody: "x", history: [] });
    expect(out.source).toBe("mock-fallback");
  });

  test("follow-up question with scoring language falls back to the mock", async () => {
    const ai = createAiFunctions(() => modelReturning(JSON.stringify({ question: "What score would you give it?" })));
    expect((await ai.nextFollowUpQuestion({ storyBody: "x", history: [] })).source).toBe("mock-fallback");
  });

  test("language assist output with scoring language falls back to the mock", async () => {
    const ai = createAiFunctions(() => modelReturning(JSON.stringify({ text: "Hello. Match score 90%." })));
    const out = await ai.languageAssist({ text: "Hello", mode: "grammar" });
    expect(out).toEqual({ source: "mock-fallback", value: { text: "Hello", label: "language edited" } });
  });

  test("extracted phrases that score a person are dropped, others kept", async () => {
    const ai = createAiFunctions(() =>
      modelReturning(JSON.stringify({ requirements: ["Python", "Candidate score above 80%"] })),
    );
    expect(await ai.extractRequirements("ad")).toEqual({ source: "model", value: ["Python"] });
  });

  test("language label comes from code, not the model", async () => {
    const ai = createAiFunctions(() => modelReturning(JSON.stringify({ text: "Hei maailma" })));
    const out = await ai.languageAssist({ text: "Hello", mode: "translate", sourceLanguage: "English", targetLanguage: "Finnish" });
    expect(out).toEqual({ source: "model", value: { text: "Hei maailma", label: "translated from English" } });
  });

  test("schema-invalid output falls back to the mock", async () => {
    const ai = createAiFunctions(() => modelReturning("not json"));
    expect((await ai.extractRequirements("- a")).source).toBe("mock-fallback");
  });
});
