import { z } from "zod";
import type { AiResult } from "./functions";
import { checkRateLimit } from "./rateLimit";

/** Requests larger than this get 413. */
export const MAX_BODY_BYTES = 20_000;
const FALLBACK_KEY = "local";

function clientKey(req: Request): string {
  // The proxy appends the real peer last; earlier values are client-controlled.
  const last = req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
  return last || FALLBACK_KEY;
}

async function readJson(req: Request): Promise<{ ok: true; value: unknown } | { ok: false; status: number }> {
  const declared = Number(req.headers.get("content-length"));
  if (declared > MAX_BODY_BYTES) return { ok: false, status: 413 };
  const text = await req.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return { ok: false, status: 413 };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, status: 400 };
  }
}

/**
 * Shared POST handler: size cap (413), zod validation (400), rate limit.
 * When rate limited it answers 200 with `mock()` and source "mock-fallback" (never 429).
 * `live` or `mock` returning null means the referenced resource was not found (404).
 */
export function handle<S extends z.ZodType, T>(
  schema: S,
  live: (input: z.infer<S>) => Promise<AiResult<T> | null>,
  mock: (input: z.infer<S>) => T | null | Promise<T | null>,
) {
  return async (req: Request): Promise<Response> => {
    const body = await readJson(req);
    if (!body.ok) return Response.json({ error: "invalid-body" }, { status: body.status });
    const parsed = schema.safeParse(body.value);
    if (!parsed.success) return Response.json({ error: "invalid-body" }, { status: 400 });

    const allowed = checkRateLimit(clientKey(req), Date.now());
    const result: AiResult<T> | null = allowed
      ? await live(parsed.data)
      : await mockResult(mock, parsed.data);
    if (!result) return Response.json({ error: "not-found" }, { status: 404 });
    return Response.json(result);
  };
}

async function mockResult<I, T>(
  mock: (input: I) => T | null | Promise<T | null>,
  input: I,
): Promise<AiResult<T> | null> {
  const value = await mock(input);
  return value === null ? null : { value, source: "mock-fallback" };
}
