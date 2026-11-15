import { describe, expect, test, vi } from "vitest";
import type { AiResult } from "./functions";
import type { SuggestedFilter } from "./guardrails";
import { createSuggestionCache } from "./suggestionCache";

const KEY = "event-01:company-01";
const FILTER = { id: "f1", label: "Has a Python example" } as SuggestedFilter;

const result = (source: AiResult<SuggestedFilter[]>["source"], value: SuggestedFilter[] = [FILTER]) =>
  Promise.resolve({ value, source });

describe("suggestionCache", () => {
  test("get_concurrentCalls_shareOneBuild", async () => {
    const cache = createSuggestionCache();
    const build = vi.fn(() => result("model"));
    const [a, b] = await Promise.all([cache.get(KEY, build), cache.get(KEY, build)]);
    expect(build).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  test("get_modelResult_isKept", async () => {
    const cache = createSuggestionCache();
    const build = vi.fn(() => result("model"));
    await cache.get(KEY, build);
    await cache.get(KEY, build);
    expect(build).toHaveBeenCalledTimes(1);
  });

  test("get_refresh_rebuilds", async () => {
    const cache = createSuggestionCache();
    const build = vi.fn(() => result("model"));
    await cache.get(KEY, build);
    await cache.get(KEY, build, true);
    expect(build).toHaveBeenCalledTimes(2);
  });

  test("get_mockFallback_isNotKept", async () => {
    const cache = createSuggestionCache();
    const build = vi.fn(() => result("mock-fallback"));
    await cache.get(KEY, build);
    await cache.get(KEY, build);
    expect(build).toHaveBeenCalledTimes(2);
  });

  test("get_emptyModelResult_isNotKept", async () => {
    const cache = createSuggestionCache();
    const build = vi.fn(() => result("model", []));
    await cache.get(KEY, build);
    await cache.get(KEY, build);
    expect(build).toHaveBeenCalledTimes(2);
  });

  test("get_rejectedBuild_isNotKept", async () => {
    const cache = createSuggestionCache();
    const build = vi.fn().mockRejectedValueOnce(new Error("down")).mockImplementation(() => result("model"));
    await expect(cache.get(KEY, build)).rejects.toThrow("down");
    await expect(cache.get(KEY, build)).resolves.toMatchObject({ source: "model" });
    expect(build).toHaveBeenCalledTimes(2);
  });
});
