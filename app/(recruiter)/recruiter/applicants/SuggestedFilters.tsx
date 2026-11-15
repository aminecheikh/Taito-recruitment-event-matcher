"use client";

import { useEffect, useRef, useState } from "react";
import type { SuggestedFilter } from "@/lib/ai/guardrails";
import { suggestedFilterId } from "@/lib/domain/activeFilters";

const SUGGEST_URL = "/api/ai/suggest-filters";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; filters: SuggestedFilter[] }
  | { kind: "unavailable"; text: string };

const UNAVAILABLE: Record<string, string> = {
  mock: "No AI connected, so there are no suggested filters. The list works as usual.",
  "mock-fallback": "Suggested filters are unavailable right now. Try Refresh in a minute; the list works as usual.",
};

type Props = {
  /** Applicants on the list right now, to count how many each filter matches. */
  shownIds: readonly string[];
  activeIds: ReadonlySet<string>;
  onApply: (filter: SuggestedFilter) => void;
};

/**
 * Dropdown of filters the AI suggests after reading this job's cards. Loaded the first time it opens,
 * then kept until Refresh. Nothing is applied until the recruiter clicks one; it never selects anyone.
 */
export function SuggestedFilters({ shownIds, activeIds, onApply }: Props) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const details = useRef<HTMLDetailsElement>(null);
  const shown = new Set(shownIds);

  const load = async (refresh: boolean) => {
    setStatus({ kind: "loading" });
    try {
      const res = await fetch(SUGGEST_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = (await res.json()) as { value: SuggestedFilter[]; source: string };
      if (data.source !== "model") return setStatus({ kind: "unavailable", text: UNAVAILABLE[data.source] ?? UNAVAILABLE["mock-fallback"] });
      setStatus({ kind: "ready", filters: data.value });
    } catch {
      setStatus({ kind: "unavailable", text: UNAVAILABLE["mock-fallback"] });
    }
  };

  // Close like a menu: Esc or a click outside.
  useEffect(() => {
    const close = (e: Event) => {
      const el = details.current;
      if (!el?.open) return;
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !el.contains(e.target as Node)) el.open = false;
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", close);
    return () => {
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", close);
    };
  }, []);

  const apply = (filter: SuggestedFilter) => {
    onApply(filter);
    if (details.current) details.current.open = false;
  };

  return (
    <details
      ref={details}
      className="relative"
      onToggle={(e) => {
        if ((e.currentTarget as HTMLDetailsElement).open && status.kind === "idle") void load(false);
      }}
    >
      <summary className="btn flex cursor-pointer list-none items-center gap-2">
        Suggested filters
        <span className="tag tag-ai">AI</span>
        <span aria-hidden="true">▾</span>
      </summary>
      <div className="panel absolute left-0 top-full z-30 mt-2 w-[26rem] max-w-[calc(100vw-2rem)] shadow-lg">
        <p className="font-semibold">Suggested filters you may apply</p>
        <p className="hint mt-1">
          The AI read the card examples for this job and suggests these. Nothing is applied until you click one, and it
          never selects anyone.
        </p>
        <div className="mt-3" aria-live="polite">
          {status.kind === "loading" && <p className="hint">Reading the cards…</p>}
          {status.kind === "unavailable" && <p className="hint">{status.text}</p>}
          {status.kind === "ready" && status.filters.length === 0 && (
            <p className="hint">No useful filters for this list. Use “Filter with AI” to ask for something specific.</p>
          )}
          {status.kind === "ready" && status.filters.length > 0 && (
            <ul className="space-y-1">
              {status.filters.map((f) => {
                const count = f.applicant_ids.filter((id) => shown.has(id)).length;
                const active = activeIds.has(suggestedFilterId(f));
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-surface disabled:opacity-60"
                      disabled={active || count === 0}
                      onClick={() => apply(f)}
                    >
                      <span className="block font-medium">
                        {f.label} ({count}){active ? " · applied" : ""}
                      </span>
                      {f.description && <span className="hint block">{f.description}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <button type="button" className="btn btn-sm btn-quiet mt-3" disabled={status.kind === "loading"} onClick={() => void load(true)}>
          Refresh suggestions
        </button>
      </div>
    </details>
  );
}
