const WINDOW_MS = 60_000;
const DEFAULT_LIMIT_PER_MINUTE = 10;
const DEFAULT_GLOBAL_LIMIT_PER_MINUTE = 60;

const callsByKey = new Map<string, number[]>();
let globalCalls: number[] = [];

function positiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const withinWindow = (calls: number[], nowMs: number) => calls.filter((t) => nowMs - t < WINDOW_MS);

/** Drops keys whose window is empty so the map stays bounded by recently active keys. */
function evictIdleKeys(nowMs: number): void {
  for (const [key, calls] of callsByKey) {
    if (!calls.some((t) => nowMs - t < WINDOW_MS)) callsByKey.delete(key);
  }
}

/** Number of tracked keys (for tests). */
export const trackedKeyCount = (): number => callsByKey.size;

/**
 * Sliding 60 s window per key plus one global window (AI_GLOBAL_RATE_LIMIT_PER_MINUTE).
 * Returns true when the call is allowed and records it; a refused call is not recorded.
 */
export function checkRateLimit(key: string, nowMs: number): boolean {
  evictIdleKeys(nowMs);
  globalCalls = withinWindow(globalCalls, nowMs);
  const recent = withinWindow(callsByKey.get(key) ?? [], nowMs);
  const keyLimit = positiveInt(process.env.AI_RATE_LIMIT_PER_MINUTE, DEFAULT_LIMIT_PER_MINUTE);
  const globalLimit = positiveInt(process.env.AI_GLOBAL_RATE_LIMIT_PER_MINUTE, DEFAULT_GLOBAL_LIMIT_PER_MINUTE);
  if (recent.length >= keyLimit || globalCalls.length >= globalLimit) return false;
  callsByKey.set(key, [...recent, nowMs]);
  globalCalls = [...globalCalls, nowMs];
  return true;
}
