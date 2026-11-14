"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSuggestions } from "@/app/actions/links";
import { FALLBACK_NOTICE, buttonClass } from "../../stories/ui";
import { SuggestLinksResponseSchema } from "../ui";

const SUGGEST_URL = "/api/ai/suggest-links";

type StoryRef = { id: string };

async function suggestForStory(storyId: string): Promise<{ added: number; fallback: boolean }> {
  const res = await fetch(SUGGEST_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ storyId }) });
  if (!res.ok) throw new Error("bad status");
  const data = SuggestLinksResponseSchema.parse(await res.json());
  const saved = await saveSuggestions(storyId, data.value);
  if (!saved.ok) throw new Error(saved.error);
  return { added: saved.added ?? 0, fallback: data.source === "mock-fallback" };
}

/** AI only recommends stories for the cards; nothing is saved to a card until the applicant acts. */
export function SuggestStoriesButton({ stories }: { stories: StoryRef[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const [added, setAdded] = useState<number | null>(null);

  if (stories.length === 0) {
    return (
      <p className="hint mt-6">
        You have no stories yet. <Link href="/applicant/stories" className="link">Write a story</Link> and the AI can suggest which cards it fits.
      </p>
    );
  }

  const run = async () => {
    setBusy(true);
    setError(null);
    setAdded(null);
    setFallback(false);
    try {
      let total = 0;
      let anyFallback = false;
      for (const story of stories) {
        const result = await suggestForStory(story.id);
        total += result.added;
        anyFallback = anyFallback || result.fallback;
      }
      setFallback(anyFallback);
      setAdded(total);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error && e.message !== "bad status" ? e.message : "Something went wrong. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6">
      <button type="button" className={buttonClass} disabled={busy} onClick={run}>
        {busy ? "Working" : "Suggest which of my stories fit"}
      </button>
      {fallback ? <p className="hint mt-2">{FALLBACK_NOTICE}</p> : null}
      {added === 0 ? <p className="hint mt-2" aria-live="polite">No new suggestions.</p> : null}
      {added !== null && added > 0 ? <p className="hint mt-2" aria-live="polite">{added} new {added === 1 ? "suggestion" : "suggestions"} across your companies.</p> : null}
      {error ? <p role="alert" className="mt-2 font-medium text-danger">{error}</p> : null}
    </div>
  );
}
