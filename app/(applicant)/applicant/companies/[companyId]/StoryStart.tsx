"use client";

import { useState } from "react";
import { buttonClass, fieldClass } from "../../stories/ui";
import type { RecommendationView, StoryView } from "../ui";

type Props = {
  idPrefix: string;
  recommendations: RecommendationView[];
  stories: StoryView[];
  busy: boolean;
  onStart: (story: StoryView) => void;
  onDismiss: (linkId: string) => void;
};

/** Helper only: starting from a story fills the text box, nothing is saved until the applicant presses Save. */
export function StoryStart({ idPrefix, recommendations, stories, busy, onStart, onDismiss }: Props) {
  const [chosen, setChosen] = useState(stories[0]?.id ?? "");
  if (stories.length === 0 && recommendations.length === 0) return null;
  const picked = stories.find((s) => s.id === chosen);
  return (
    <section className="mt-5 border-t border-line pt-4" aria-label="Start from a story">
      <h3 className="label">Start from a story</h3>
      {recommendations.length > 0 ? (
        <ul className="mt-2 space-y-3">
          {recommendations.map((r) => (
            <li key={r.linkId} className="ai-panel">
              <p><span className="tag tag-ai">AI suggestion</span></p>
              <p className="mt-2 font-semibold">{r.story.title || "Untitled story"}</p>
              <p className="mt-1 text-[0.9375rem] text-muted">Why: {r.reason}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={`${buttonClass} btn-primary btn-sm`} disabled={busy} onClick={() => onStart(r.story)}>Start from this story</button>
                <button type="button" className={`${buttonClass} btn-sm`} disabled={busy} onClick={() => onDismiss(r.linkId)}>Dismiss</button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {stories.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor={`${idPrefix}-story`} className="hint w-full">Pick one of your stories</label>
          <select id={`${idPrefix}-story`} className={`${fieldClass} field-inline min-w-0 flex-1 max-sm:basis-full`} value={chosen} onChange={(e) => setChosen(e.target.value)}>
            {stories.map((s) => <option key={s.id} value={s.id}>{s.title || "Untitled story"}</option>)}
          </select>
          <button type="button" className={`${buttonClass} btn-sm`} disabled={busy || !picked} onClick={() => picked && onStart(picked)}>Start from this story</button>
        </div>
      ) : null}
    </section>
  );
}
