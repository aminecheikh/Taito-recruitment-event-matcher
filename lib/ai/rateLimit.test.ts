import { describe, expect, test } from "vitest";
import { checkRateLimit } from "./rateLimit";

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
});
