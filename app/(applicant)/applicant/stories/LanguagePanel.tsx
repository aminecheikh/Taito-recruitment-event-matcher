"use client";

import { useState } from "react";
import type { LanguageLabel } from "@/lib/domain/types";
import { EXAMPLE_MODE_NOTICE, FALLBACK_NOTICE, LanguageResponseSchema, buttonClass, fieldClass, primaryClass } from "./ui";

const LANGUAGE_URL = "/api/ai/language";
const TARGET_LANGUAGE = "English";

/** `original` is the text as it was when the suggestion was requested. */
type Suggestion = { original: string; text: string; label: LanguageLabel; fallback: boolean; example: boolean };

/** Works on the story text as typed. The result stays a suggestion until the applicant picks "Use this version". */
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
  const [showTranslate, setShowTranslate] = useState(false);
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
      setShowTranslate(false);
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
    <div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={`${buttonClass} btn-sm`} onClick={() => run("grammar")} disabled={loading || empty}
          title="Fix spelling and grammar. You decide whether to use the result.">
          {loading ? "Working…" : "Fix language"}
        </button>
        <button type="button" className={`${buttonClass} btn-sm`} onClick={() => setShowTranslate((open) => !open)} disabled={loading || empty}
          aria-expanded={showTranslate} aria-controls={`${idPrefix}-translate`}>
          Translate
        </button>
      </div>
      {showTranslate ? (
        <div id={`${idPrefix}-translate`} className="mt-3">
          <label htmlFor={`${idPrefix}-source-language`} className="label">Written in</label>
          <div className="mt-1 flex gap-2">
            <input id={`${idPrefix}-source-language`} className={`${fieldClass} min-w-0 flex-1`} placeholder="e.g. Ukrainian" value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)} />
            <button type="button" className={buttonClass} onClick={() => run("translate")} disabled={loading || !canTranslate}>
              To English
            </button>
          </div>
        </div>
      ) : null}
      {error ? <p role="alert" className="mt-2 text-sm font-medium text-danger">{error}</p> : null}
      {suggestion ? (
        <div className="mt-3" aria-live="polite">
          <div className="ai-panel !p-3">
            <p><span className="tag tag-ai">AI suggestion ({suggestion.label})</span></p>
            {suggestion.fallback ? <p className="hint mt-1">{FALLBACK_NOTICE}</p> : null}
            {suggestion.example ? <p className="hint mt-1">{EXAMPLE_MODE_NOTICE}</p> : null}
            {unchanged ? (
              <p className="mt-2 font-medium">No changes suggested</p>
            ) : (
              <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap text-[0.9375rem]">{suggestion.text}</p>
            )}
          </div>
          {unchanged ? null : <p className="hint mt-1">Compare it with your text in the story box.</p>}
          {stale ? <p role="alert" className="mt-2 text-sm font-medium text-danger">Your story changed — ask again</p> : null}
          <div className="mt-2 flex flex-wrap gap-2">
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
