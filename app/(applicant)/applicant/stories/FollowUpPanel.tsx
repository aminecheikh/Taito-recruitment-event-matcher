"use client";

import { useState } from "react";
import { FALLBACK_NOTICE, FollowUpResponseSchema, buttonClass, fieldClass } from "./ui";

const FOLLOW_UP_URL = "/api/ai/follow-up";

type Turn = { question: string; answer: string };
type Current = { question: string; fallback: boolean };

/** Shows one AI question at a time. It never writes into the story; only the applicant's own typed answer can be added. */
export function FollowUpPanel({ idPrefix, storyBody, onAddAnswer }: { idPrefix: string; storyBody: string; onAddAnswer: (answer: string) => void }) {
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
      const res = await fetch(FOLLOW_UP_URL, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ storyBody, history: nextHistory }),
      });
      if (!res.ok) throw new Error("bad status");
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

  const addToStory = () => {
    if (!current || !answer.trim()) return;
    onAddAnswer(answer);
    setHistory([...history, { question: current.question, answer: answer.trim() }]);
    setCurrent(null);
    setAnswer("");
  };

  const close = () => {
    setCurrent(null);
    setAnswer("");
  };

  return (
    <div>
      <button type="button" className={`${buttonClass} w-full`} onClick={ask} disabled={loading || storyBody.trim() === ""}
        title="An AI asks one question at a time to help you remember details">
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
          <label htmlFor={`${idPrefix}-follow-up-answer`} className="label mt-3">Your answer, in your own words</label>
          <textarea id={`${idPrefix}-follow-up-answer`} className={`${fieldClass} mt-1`} rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" className={buttonClass} onClick={addToStory} disabled={answer.trim() === ""}>
              Add to my story
            </button>
            <button type="button" className={buttonClass} onClick={close}>Close</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
