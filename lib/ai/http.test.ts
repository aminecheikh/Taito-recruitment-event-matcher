import { beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";
import { MAX_BODY_BYTES, handle } from "./http";

const schema = z.object({ text: z.string() });

function post(body: string, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/ai/x", { method: "POST", body, headers });
}

describe("handle", () => {
  beforeEach(() => {
    vi.stubEnv("AI_RATE_LIMIT_PER_MINUTE", "2");
  });

  test("handle_validBody_returnsLiveResult", async () => {
    const route = handle(
      schema,
      async ({ text }) => ({ value: text.toUpperCase(), source: "model" }),
      ({ text }) => text,
    );
    const res = await route(post('{"text":"hi"}', { "x-forwarded-for": "valid-ip" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ value: "HI", source: "model" });
  });

  test("handle_invalidBody_returns400", async () => {
    const route = handle(schema, async () => ({ value: "x", source: "model" }), () => "x");
    expect((await route(post("{}", { "x-forwarded-for": "bad-1" }))).status).toBe(400);
    expect((await route(post("not json", { "x-forwarded-for": "bad-2" }))).status).toBe(400);
  });

  test("handle_bodyOverCap_returns413", async () => {
    const route = handle(schema, async () => ({ value: "x", source: "model" }), () => "x");
    const big = JSON.stringify({ text: "a".repeat(MAX_BODY_BYTES + 1) });
    expect((await route(post(big, { "x-forwarded-for": "big" }))).status).toBe(413);
  });

  test("handle_rateLimited_returns200WithMockFallback", async () => {
    const live = vi.fn(async () => ({ value: "live", source: "model" as const }));
    const route = handle(schema, live, () => "mocked");
    const headers = { "x-forwarded-for": "9.9.9.9, 1.1.1.1" };
    await route(post('{"text":"a"}', headers));
    await route(post('{"text":"a"}', headers));
    const res = await route(post('{"text":"a"}', headers));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ value: "mocked", source: "mock-fallback" });
    expect(live).toHaveBeenCalledTimes(2);
  });

  test("handle_unknownResource_returns404", async () => {
    const route = handle(schema, async () => null, () => null);
    expect((await route(post('{"text":"a"}', { "x-forwarded-for": "nf" }))).status).toBe(404);
  });
});
