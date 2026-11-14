import { afterEach, describe, expect, test, vi } from "vitest";
import { getModel } from "./provider";
import { suggestLinks } from "./functions";

afterEach(() => vi.unstubAllEnvs());

describe("getModel", () => {
  test("returns null for the mock provider and when the key is missing", () => {
    vi.stubEnv("AI_PROVIDER", "mock");
    expect(getModel()).toBeNull();
    vi.stubEnv("AI_PROVIDER", "anthropic");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(getModel()).toBeNull();
  });

  test("returns null for prototype-chain provider names", () => {
    vi.stubEnv("AI_PROVIDER", "constructor");
    expect(getModel()).toBeNull();
  });

  test("honours AI_MODEL for a configured provider", () => {
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("AI_MODEL", "custom-model");
    expect(getModel()).toMatchObject({ modelId: "custom-model" });
  });

  test("default exports use the mock when AI_PROVIDER=mock", async () => {
    vi.stubEnv("AI_PROVIDER", "mock");
    const out = await suggestLinks({ story: { id: "s", body: "x" }, requirements: [] });
    expect(out.source).toBe("mock");
  });
});
