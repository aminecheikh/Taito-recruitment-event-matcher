"use client";

import { useState } from "react";
import type { LanguageLabel } from "@/lib/domain/types";
import { EXAMPLE_MODE_NOTICE, FALLBACK_NOTICE, LanguageResponseSchema, buttonClass, fieldClass, primaryClass } from "./ui";

const LANGUAGE_URL = "/api/ai/language";
const TARGET_LANGUAGE = "English";

/** `original` is the text as it was when the suggestion was requested. */
type Suggestion = { original: string; text: string; label: LanguageLabel; fallback: boolean; example: boolean };

export function LanguagePanel({
  idPrefix,
  text,
  onAccept,
  disabled,
}: {
  idPrefix: string;
  text: string;
  onAccept: (text: string, label: LanguageLabel) => void;
  disabled: boolean;
}) {
  const [sourceLanguage, setSourceLanguage] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (mode: "grammar" | "translate") => {
    setLoading(true);
    setError(null);
    const payload =
      mode === "grammar"
        ? { text, mode }
        : { text, mode, sourceLanguage: sourceLanguage.trim(), targetLanguage: TARGET_LANGUAGE };
    try {
      const res = await fetch(LANGUAGE_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("bad status");
      const data = LanguageResponseSchema.parse(await res.json());
      setSuggestion({ original: text, text: data.value.text, label: data.value.label, fallback: data.source === "mock-fallback", example: data.source === "mock" });
    } catch {
      setError("Could not get a suggestion right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const unchanged = suggestion !== null && suggestion.text.trim() === suggestion.original.trim();
  const stale = suggestion !== null && suggestion.original !== text;
  const empty = text.trim() === "";
  const canTranslate = !empty && sourceLanguage.trim() !== "";

  return (
    <div className="rounded border border-neutral-300 bg-neutral-50 p-3">
      <h3 className="font-medium">Language help</h3>
      <p className="text-sm text-neutral-800">Works on the text above, as saved or typed. You decide whether to use the result.</p>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <button type="button" className={buttonClass} onClick={() => run("grammar")} disabled={loading || empty}>
          Fix language
        </button>
        <div>
          <label htmlFor={`${idPrefix}-source-language`} className="block text-sm font-medium">Written in</label>
          <input id={`${idPrefix}-source-language`} className={`${fieldClass} min-h-11`} placeholder="for example Ukrainian" value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)} />
        </div>
        <button type="button" className={buttonClass} onClick={() => run("translate")} disabled={loading || !canTranslate}>
          Translate from {sourceLanguage.trim() || "…"} to English
        </button>
      </div>
      {error ? <p role="alert" className="mt-2 text-red-800">{error}</p> : null}
      {suggestion ? (
        <div className="mt-3" aria-live="polite">
          <p className="text-sm font-medium text-neutral-800">AI suggestion ({suggestion.label})</p>
          {suggestion.fallback ? <p className="text-sm text-neutral-800">{FALLBACK_NOTICE}</p> : null}
          {suggestion.example ? <p className="text-sm text-neutral-800">{EXAMPLE_MODE_NOTICE}</p> : null}
          {unchanged ? <p className="mt-2 font-medium text-neutral-900">No changes suggested</p> : null}
          {unchanged ? null : (
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium">Before (yours)</h4>
              <p className="mt-1 whitespace-pre-wrap rounded border border-neutral-400 bg-white p-2">{suggestion.original}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">After (AI suggestion)</h4>
              <p className="mt-1 whitespace-pre-wrap rounded border border-neutral-400 bg-white p-2">{suggestion.text}</p>
            </div>
          </div>
          )}
          {stale ? <p role="alert" className="mt-2 text-red-800">Your story changed — ask again</p> : null}
          <div className="mt-3 flex gap-3">
            {unchanged ? null : (
              <button type="button" className={primaryClass} disabled={disabled || stale} onClick={() => { onAccept(suggestion.text, suggestion.label); setSuggestion(null); }}>
                Use this version
              </button>
            )}
            <button type="button" className={buttonClass} onClick={() => setSuggestion(null)}>Keep mine</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
