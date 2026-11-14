const WINDOW_MS = 60_000;
const DEFAULT_LIMIT_PER_MINUTE = 10;

const callsByKey = new Map<string, number[]>();

function limitPerMinute(): number {
  const parsed = Number(process.env.AI_RATE_LIMIT_PER_MINUTE);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_LIMIT_PER_MINUTE;
}

/** Sliding 60 s window per key. Returns true when the call is allowed and records it. */
export function checkRateLimit(key: string, nowMs: number): boolean {
  const recent = (callsByKey.get(key) ?? []).filter((t) => nowMs - t < WINDOW_MS);
  if (recent.length >= limitPerMinute()) {
    callsByKey.set(key, recent);
    return false;
  }
  callsByKey.set(key, [...recent, nowMs]);
  return true;
}
