"use client";

import { useState } from "react";
import { FALLBACK_NOTICE, FollowUpResponseSchema } from "@/app/(applicant)/applicant/stories/ui";
import { REFUSAL_MESSAGE } from "@/lib/ai/guardrails";

const RECRUITER_FOLLOW_UP_URL = "/api/ai/recruiter-follow-up";

type Turn = { question: string; answer: string };
type Current = { question: string; fallback: boolean };

/** Shows one AI recall question at a time. It never writes the in-practice line; the recruiter types it. */
export function RecruiterFollowUp({ idPrefix, requirementText, inPractice }: { idPrefix: string; requirementText: string; inPractice: string }) {
  const [history, setHistory] = useState<Turn[]>([]);
  const [current, setCurrent] = useState<Current | null>(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = async () => {
    const nextHistory = current && answer.trim() ? [...history, { question: current.question, answer: answer.trim() }] : history;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(RECRUITER_FOLLOW_UP_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requirementText, inPractice, history: nextHistory }),
      });
      if (res.status === 422) {
        const refused = (await res.json()) as { message?: string };
        setError(refused.message ?? REFUSAL_MESSAGE);
        return;
      }
      if (!res.ok) throw new Error(`status ${res.status}`);
      const data = FollowUpResponseSchema.parse(await res.json());
      setHistory(nextHistory);
      setCurrent({ question: data.value, fallback: data.source === "mock-fallback" });
      setAnswer("");
    } catch {
      setError("Could not get a question right now. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setCurrent(null);
    setAnswer("");
  };

  return (
    <div className="mt-2">
      <button type="button" className="btn btn-sm" onClick={ask} disabled={loading || requirementText.trim() === ""}
        title="An AI asks one question at a time to help you describe this in your own words">
        {loading ? "Thinking…" : current ? "Another question" : "Ask me a question"}
      </button>
      {error ? <p role="alert" className="mt-2 text-sm font-medium text-danger">{error}</p> : null}
      {current ? (
        <div className="mt-3" aria-live="polite">
          <div className="ai-panel !p-3">
            <p><span className="tag tag-ai">AI question</span></p>
            {current.fallback ? <p className="hint mt-1">{FALLBACK_NOTICE}</p> : null}
            <p className="mt-2 font-serif leading-snug">{current.question}</p>
          </div>
          <label htmlFor={`${idPrefix}-recall-answer`} className="label mt-3">Your thoughts, kept here to shape the next question</label>
          <textarea id={`${idPrefix}-recall-answer`} className="field mt-1" rows={2} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <p className="hint mt-1">Then write the in-practice line yourself, above.</p>
          <button type="button" className="btn btn-sm mt-2" onClick={close}>Close</button>
        </div>
      ) : null}
    </div>
  );
}
