import { afterEach, describe, expect, test, vi } from "vitest";
import { checkRateLimit, trackedKeyCount } from "./rateLimit";

afterEach(() => vi.unstubAllEnvs());

describe("checkRateLimit", () => {
  test("allows 10 calls in 60 s, blocks the 11th, allows again after the window", () => {
    const key = "a";
    for (let i = 0; i < 10; i += 1) expect(checkRateLimit(key, 1_000 + i)).toBe(true);
    expect(checkRateLimit(key, 2_000)).toBe(false);
    expect(checkRateLimit(key, 62_000)).toBe(true);
  });

  test("tracks keys independently", () => {
    for (let i = 0; i < 10; i += 1) checkRateLimit("b", 5_000);
    expect(checkRateLimit("b", 5_001)).toBe(false);
    expect(checkRateLimit("c", 5_001)).toBe(true);
  });

  test("blocks every key once the global cap is reached", () => {
    vi.stubEnv("AI_GLOBAL_RATE_LIMIT_PER_MINUTE", "3");
    const base = 1_000_000;
    expect(checkRateLimit("g1", base)).toBe(true);
    expect(checkRateLimit("g2", base + 1)).toBe(true);
    expect(checkRateLimit("g3", base + 2)).toBe(true);
    expect(checkRateLimit("g4", base + 3)).toBe(false);
    expect(checkRateLimit("g1", base + 61_000)).toBe(true);
  });

  test("evicts keys whose window is empty so the map stays bounded", () => {
    const base = 5_000_000;
    for (let i = 0; i < 50; i += 1) checkRateLimit(`evict-${i}`, base);
    expect(trackedKeyCount()).toBeGreaterThanOrEqual(50);
    checkRateLimit("evict-fresh", base + 120_000);
    expect(trackedKeyCount()).toBe(1);
  });
});
