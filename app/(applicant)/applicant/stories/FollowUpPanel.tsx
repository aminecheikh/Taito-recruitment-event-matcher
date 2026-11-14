"use client";

import { useState } from "react";
import { FALLBACK_NOTICE, buttonClass, fieldClass } from "./ui";

const FOLLOW_UP_URL = "/api/ai/follow-up";

type Turn = { question: string; answer: string };
type Current = { question: string; fallback: boolean };

/** Shows one AI question at a time. It never writes into the story; only the applicant's own typed answer can be added. */
export function FollowUpPanel({ storyBody, onAddAnswer }: { storyBody: string; onAddAnswer: (answer: string) => void }) {
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
      const data = (await res.json()) as { value: string; source: string };
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

  return (
    <div className="rounded border border-neutral-300 bg-neutral-50 p-3">
      <h3 className="font-medium">Need a nudge?</h3>
      <button type="button" className={`${buttonClass} mt-2`} onClick={ask} disabled={loading || storyBody.trim() === ""}>
        {loading ? "Thinking" : current ? "Ask me another question" : "Ask me a question"}
      </button>
      {error ? <p role="alert" className="mt-2 text-red-800">{error}</p> : null}
      {current ? (
        <div className="mt-3" aria-live="polite">
          <p className="text-sm font-medium text-neutral-800">AI question</p>
          {current.fallback ? <p className="text-sm text-neutral-800">{FALLBACK_NOTICE}</p> : null}
          <p className="mt-1">{current.question}</p>
          <label htmlFor="follow-up-answer" className="mt-3 block text-sm font-medium">Your answer, in your own words</label>
          <textarea id="follow-up-answer" className={fieldClass} rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <button type="button" className={`${buttonClass} mt-2`} onClick={addToStory} disabled={answer.trim() === ""}>
            Add to my story
          </button>
        </div>
      ) : null}
    </div>
  );
}
