"use client";

import { useState } from "react";
import type { SearchResult } from "@/lib/ai/guardrails";

const SEARCH_URL = "/api/ai/search-applicants";

const UNAVAILABLE: Record<string, string> = {
  mock: "No AI connected, so the AI filter is off. The list, selection and invites work as usual.",
  "mock-fallback": "The AI is unavailable right now. Try again in a minute; the list works as usual.",
};

type Props = {
  minCovered: number;
  markedOnly: boolean;
  disabled: boolean;
  onResult: (result: SearchResult) => void;
};

/** Optional helper, closed by default. It only answers the recruiter's question; it never selects or acts. */
export function AiSearchPanel({ minCovered, markedOnly, disabled, onResult }: Props) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(SEARCH_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, minCovered, markedOnly }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as { value: SearchResult; source: string };
      if (data.source !== "model") return setNote(UNAVAILABLE[data.source] ?? UNAVAILABLE["mock-fallback"]);
      onResult(data.value);
    } catch {
      setNote(UNAVAILABLE["mock-fallback"]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <details className="panel mt-6">
      <summary className="flex cursor-pointer flex-wrap items-center gap-3">
        <span className="h3">Filter with AI</span>
        <span className="tag tag-ai">Optional AI help</span>
      </summary>
      <form onSubmit={search} className="mt-4 space-y-3">
        <label htmlFor="ai-query" className="hint block">
          The AI reads only the card examples on the list below, not scores or names. It lists who fits, with a
          reason from their card. You decide whom to invite.
        </label>
        <textarea
          id="ai-query"
          rows={2}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe who you're looking for…"
          className="field py-2"
        />
        <button type="submit" className="btn" disabled={busy || disabled || query.trim() === ""}>
          {busy ? "Searching the cards…" : "Search"}
        </button>
        {note && (
          <p role="status" className="hint">
            {note}
          </p>
        )}
      </form>
    </details>
  );
}
