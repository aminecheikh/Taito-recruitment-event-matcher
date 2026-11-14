"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { inviteSelectedAction, markForLaterAction } from "@/app/actions/recruiter";
import type { SearchResult } from "@/lib/ai/guardrails";
import type { Card } from "@/lib/domain/cards";
import { keepShown, summarise, toggleAll, toggleOne } from "@/lib/domain/selection";
import { AiSearchPanel } from "./AiSearchPanel";
import { ScoredCard } from "./ScoreInputs";

export type ApplicantRow = {
  id: string;
  card: Card;
  initialScores: Record<string, number>;
  coverageText: string;
  marked: boolean;
};

type Props = { rows: ApplicantRow[]; slotsLeft: number; minCovered: number; markedOnly: boolean };
type Notice = { kind: "error" | "success"; text: string } | null;
type Section = { label?: string; ids: string[]; reasons: Record<string, string> };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function inviteMessage(invited: number, alreadyInvited: number): string {
  if (invited === 0) return `${plural(alreadyInvited, "applicant")} already invited. Nothing changed.`;
  const fresh = `${plural(invited, "new invite")} sent. Invited applicants move to Meetings.`;
  return alreadyInvited > 0 ? `${alreadyInvited} already invited, ${fresh}` : fresh;
}

/** Without an AI result: one section, the whole list. With one: a section per AI group, only listed applicants. */
function sectionsFor(rows: ApplicantRow[], result: SearchResult | null): Section[] {
  if (!result) return [{ ids: rows.map((r) => r.id), reasons: {} }];
  const known = new Set(rows.map((r) => r.id));
  return result.groups
    .map((g) => ({ label: g.label, ids: g.applicant_ids.filter((id) => known.has(id)), reasons: g.reason_per_applicant }))
    .filter((s) => s.ids.length > 0);
}

export function ApplicantList({ rows, slotsLeft, minCovered, markedOnly }: Props) {
  const router = useRouter();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<SearchResult | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, start] = useTransition();

  const byId = new Map(rows.map((r) => [r.id, r]));
  const sections = sectionsFor(rows, result);
  const shownIds = sections.flatMap((s) => s.ids);
  const selected = keepShown(picked, shownIds);
  const summary = summarise(selected, shownIds);
  const ids = [...selected];

  // A new AI result changes what is shown, so the selection starts empty again.
  const applyResult = (next: SearchResult | null) => {
    setResult(next);
    setPicked(new Set());
    setNotice(null);
  };

  const invite = () => {
    if (ids.length > 1 && !window.confirm(`Invite ${ids.length} applicants to the meeting?`)) return;
    start(async () => {
      const status = await inviteSelectedAction(ids);
      setNotice(status.ok ? { kind: "success", text: inviteMessage(status.invited, status.alreadyInvited) } : { kind: "error", text: status.error });
      if (status.ok) setPicked(new Set());
      router.refresh();
    });
  };

  const mark = (marked: boolean) =>
    start(async () => {
      const status = await markForLaterAction(ids, marked);
      const done = marked ? `Marked ${plural(ids.length, "applicant")} for later.` : `Unmarked ${plural(ids.length, "applicant")}.`;
      setNotice(status.ok ? { kind: "success", text: done } : { kind: "error", text: status.error });
      router.refresh();
    });

  return (
    <>
      <AiSearchPanel minCovered={minCovered} markedOnly={markedOnly} disabled={rows.length === 0} onResult={applyResult} />

      {result && (
        <div className="ai-panel mt-6 flex flex-wrap items-start gap-3" role="status">
          <span className="tag tag-ai">AI filter</span>
          <p className="min-w-0 flex-1">
            <span className="font-semibold">The AI looked for: </span>
            {result.interpretation} <span className="hint">({plural(summary.total, "applicant")} listed. Check their cards before you decide.)</span>
          </p>
          <button type="button" className="btn btn-sm" onClick={() => applyResult(null)}>
            Clear AI filter
          </button>
        </div>
      )}

      <div className="material material-float sticky top-20 z-10 mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-line px-4 py-3">
        <label className="choice font-semibold">
          <input
            type="checkbox"
            checked={summary.all}
            ref={(el) => {
              if (el) el.indeterminate = summary.some;
            }}
            disabled={summary.total === 0}
            onChange={(e) => setPicked(toggleAll(shownIds, e.target.checked))}
          />
          Select all shown
        </label>
        <span className="hint mr-auto" aria-live="polite">
          {summary.count} of {summary.total} selected
        </span>
        <button type="button" className="btn btn-primary btn-sm" disabled={pending || summary.count === 0} onClick={invite}>
          Invite to meeting
        </button>
        <button type="button" className="btn btn-sm" disabled={pending || summary.count === 0} onClick={() => mark(true)}>
          Mark for later
        </button>
        <button type="button" className="btn btn-sm btn-quiet" disabled={pending || summary.count === 0} onClick={() => mark(false)}>
          Unmark
        </button>
        {slotsLeft <= 0 && <p className="hint w-full">No free meeting slots left for this event.</p>}
      </div>
      {notice && (
        <p role={notice.kind === "error" ? "alert" : "status"} className={`notice mt-3 ${notice.kind === "error" ? "notice-error" : "notice-success"}`}>
          {notice.text}
        </p>
      )}

      {shownIds.length === 0 ? (
        <p className="empty-slot mt-6">
          {result ? "The AI found no applicants for this. Clear the AI filter to see everyone." : "No applicants match. Try a lower coverage."}
        </p>
      ) : (
        sections.map((section, s) => (
          <section key={s} className="mt-6" aria-label={section.label}>
            {section.label && <h2 className="h3 mb-3">{section.label} <span className="hint">({section.ids.length})</span></h2>}
            <ul className="space-y-6">
              {section.ids.map((id) => {
                const row = byId.get(id);
                if (!row) return null;
                const reason = section.reasons[id];
                return (
                  <li key={`${s}-${id}`}>
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <label className="choice">
                        <input type="checkbox" checked={selected.has(id)} onChange={(e) => setPicked(toggleOne(selected, id, e.target.checked))} />
                        Select {row.card.label}
                      </label>
                      {row.marked && <span className="tag tag-accent">Marked for later</span>}
                    </div>
                    {reason && (
                      <p className="ai-panel mb-2 !p-3">
                        <span className="tag tag-ai mr-2">AI reason</span>
                        {reason}
                      </p>
                    )}
                    <ScoredCard
                      coverageText={row.coverageText}
                      card={row.card}
                      initialScores={row.initialScores}
                      meetingRequested={false}
                      slotsLeft={slotsLeft}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
