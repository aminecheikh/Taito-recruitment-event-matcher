import type { AiResult } from "./functions";
import type { SuggestedFilter } from "./guardrails";

type Entry = Promise<AiResult<SuggestedFilter[]>>;

/**
 * Suggested filters per job (event + company), built once from the list at that moment and reused
 * until the recruiter asks to refresh. Holding the promise means recruiters opening the dropdown at
 * the same time share one AI call. Only real model answers with suggestions are kept, so a failure or an empty list is retried next time.
 * In memory: a server restart builds them again.
 */
export function createSuggestionCache() {
  const entries = new Map<string, Entry>();
  return {
    get(key: string, build: () => Entry, refresh = false): Entry {
      const cached = entries.get(key);
      if (cached && !refresh) return cached;
      const entry = build().then((result) => {
        const keep = result.source === "model" && result.value.length > 0;
        if (!keep && entries.get(key) === entry) entries.delete(key);
        return result;
      });
      entries.set(key, entry);
      entry.catch(() => entries.delete(key));
      return entry;
    },
  };
}

export const suggestionCache = createSuggestionCache();
export const suggestionKey = (eventId: string, companyId: string) => `${eventId}:${companyId}`;
