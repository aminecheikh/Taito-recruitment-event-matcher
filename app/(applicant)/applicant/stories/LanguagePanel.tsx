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
    <div className="panel">
      <h3 className="h3">Language help</h3>
      <p className="hint">Works on the text above, as saved or typed. You decide whether to use the result.</p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <button type="button" className={buttonClass} onClick={() => run("grammar")} disabled={loading || empty}>
          Fix language
        </button>
        <div>
          <label htmlFor={`${idPrefix}-source-language`} className="label">Written in</label>
          <input id={`${idPrefix}-source-language`} className={`${fieldClass} mt-1`} placeholder="for example Ukrainian" value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)} />
        </div>
        <button type="button" className={buttonClass} onClick={() => run("translate")} disabled={loading || !canTranslate}>
          Translate from {sourceLanguage.trim() || "…"} to English
        </button>
      </div>
      {error ? <p role="alert" className="mt-2 font-medium text-danger">{error}</p> : null}
      {suggestion ? (
        <div className="mt-4" aria-live="polite">
          <p><span className="tag tag-ai">AI suggestion ({suggestion.label})</span></p>
          {suggestion.fallback ? <p className="hint mt-1">{FALLBACK_NOTICE}</p> : null}
          {suggestion.example ? <p className="hint mt-1">{EXAMPLE_MODE_NOTICE}</p> : null}
          {unchanged ? <p className="mt-2 font-medium">No changes suggested</p> : null}
          {unchanged ? null : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <h4 className="label">Before (yours)</h4>
              <p className="mt-1 whitespace-pre-wrap rounded-lg border border-line bg-surface p-3 text-[0.9375rem]">{suggestion.original}</p>
            </div>
            <div>
              <h4 className="label">After (AI suggestion)</h4>
              <p className="ai-panel mt-1 whitespace-pre-wrap p-3 text-[0.9375rem]">{suggestion.text}</p>
            </div>
          </div>
          )}
          {stale ? <p role="alert" className="mt-2 font-medium text-danger">Your story changed — ask again</p> : null}
          <div className="mt-3 flex flex-wrap gap-3">
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
