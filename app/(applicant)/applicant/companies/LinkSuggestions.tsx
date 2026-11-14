"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { acceptSuggestion, linkMyself, moveSuggestion, rejectSuggestion, saveSuggestions, type LinkStatus } from "@/app/actions/links";
import { FALLBACK_NOTICE, buttonClass, fieldClass } from "../stories/ui";
import { SuggestLinksResponseSchema, type RequirementOption, type StoryLink } from "./ui";

const SUGGEST_URL = "/api/ai/suggest-links";

const label = (r: RequirementOption) => `${r.companyName} #${r.position}: ${r.text}`;

function PendingSuggestion({ link, options, busy, onDone }: { link: StoryLink; options: RequirementOption[]; busy: boolean; onDone: (fn: () => Promise<LinkStatus>) => void }) {
  const current = options.find((o) => o.id === link.requirementId);
  const sameCompany = options.filter((o) => o.companyId === current?.companyId && o.id !== link.requirementId);
  const [target, setTarget] = useState(sameCompany[0]?.id ?? "");
  if (!current) return null;
  return (
    <li className="ai-panel">
      <p><span className="tag tag-ai">AI suggestion</span></p>
      <p className="mt-2 font-semibold">{label(current)}</p>
      {link.aiReason ? <p className="mt-1 text-[0.9375rem] text-muted">Why: {link.aiReason}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" className={`${buttonClass} btn-primary`} disabled={busy} onClick={() => onDone(() => acceptSuggestion(link.id))}>Accept</button>
        <button type="button" className={buttonClass} disabled={busy} onClick={() => onDone(() => rejectSuggestion(link.id))}>Reject</button>
      </div>
      {sameCompany.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor={`${link.id}-move`} className="hint w-full">Move to another requirement of {current.companyName}</label>
          <select id={`${link.id}-move`} className={`${fieldClass} field-inline`} value={target} onChange={(e) => setTarget(e.target.value)}>
            {sameCompany.map((o) => <option key={o.id} value={o.id}>{`#${o.position}: ${o.text}`}</option>)}
          </select>
          <button type="button" className={buttonClass} disabled={busy || target === ""} onClick={() => onDone(() => moveSuggestion(link.id, target))}>Move</button>
        </div>
      ) : null}
    </li>
  );
}

/** AI only proposes; nothing is linked until the applicant accepts, moves or links it themselves. */
export function LinkSuggestions({ idPrefix, story, links, options }: { idPrefix: string; story: { id: string; title: string }; links: StoryLink[]; options: RequirementOption[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);
  const [empty, setEmpty] = useState(false);
  const [manual, setManual] = useState(options[0]?.id ?? "");

  const settle = async (fn: () => Promise<LinkStatus>) => {
    setBusy(true);
    setError(null);
    setEmpty(false);
    try {
      const res = await fn();
      if (!res.ok) setError(res.error);
      else router.refresh();
    } catch {
      setError("Something went wrong. Try again in a moment.");
    } finally {
      setBusy(false);
    }
  };

  const suggest = () =>
    settle(async () => {
      const res = await fetch(SUGGEST_URL, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ storyId: story.id }) });
      if (!res.ok) throw new Error("bad status");
      const data = SuggestLinksResponseSchema.parse(await res.json());
      setFallback(data.source === "mock-fallback");
      const saved = await saveSuggestions(story.id, data.value);
      setEmpty(saved.ok && !saved.added);
      return saved;
    });

  const byId = new Map(options.map((o) => [o.id, o]));
  const pending = links.filter((l) => l.status === "pending");
  const accepted = links.filter((l) => l.status === "accepted" && byId.has(l.requirementId));

  return (
    <section className="card" aria-labelledby={`${idPrefix}-heading`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id={`${idPrefix}-heading`} className="font-serif text-xl font-semibold">{story.title || "Untitled story"}</h3>
        <button type="button" className={buttonClass} disabled={busy} onClick={suggest}>
          {busy ? "Working" : "Suggest where this fits"}
        </button>
      </div>
      {fallback ? <p className="hint mt-2">{FALLBACK_NOTICE}</p> : null}
      {empty ? <p className="hint mt-2" aria-live="polite">No new suggestions for this story.</p> : null}
      {error ? <p role="alert" className="mt-2 font-medium text-danger">{error}</p> : null}
      {pending.length > 0 ? (
        <ul className="mt-3 space-y-3" aria-live="polite">
          {pending.map((l) => <PendingSuggestion key={l.id} link={l} options={options} busy={busy} onDone={settle} />)}
        </ul>
      ) : null}
      {accepted.length > 0 ? (
        <div className="mt-4">
          <p className="label">Linked examples</p>
          <ul className="mt-2 space-y-2">
            {accepted.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-line px-3 py-2">
                <span className="flex-1 font-medium">{label(byId.get(l.requirementId)!)}</span>
                <span className="tag tag-success">{l.origin === "ai-suggested" ? "AI suggestion, accepted by you" : "Linked by you"}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {options.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <label htmlFor={`${idPrefix}-manual`} className="label w-full">Link it myself to</label>
          <select id={`${idPrefix}-manual`} className={`${fieldClass} field-inline min-w-0 flex-1`} value={manual} onChange={(e) => setManual(e.target.value)}>
            {options.map((o) => <option key={o.id} value={o.id}>{label(o)}</option>)}
          </select>
          <button type="button" className={buttonClass} disabled={busy || manual === ""} onClick={() => settle(() => linkMyself(story.id, manual))}>Link it myself</button>
        </div>
      ) : null}
    </section>
  );
}
