"use client";

import { useRouter } from "next/navigation";
import { useReducer, useRef, useState, useTransition } from "react";
import { ToastView, useToast } from "@/app/components/Toast";
import { inviteSelectedAction, markForLaterAction } from "@/app/actions/recruiter";
import type { SearchResult, SuggestedFilter } from "@/lib/ai/guardrails";
import type { Card } from "@/lib/domain/cards";
import { addFilter, applyFilters, fromSearch, fromSuggested, matchLine, reasonsFor, removeFilter, sectionGroups, type ActiveFilter } from "@/lib/domain/activeFilters";
import { CLOSED, popoverReducer } from "@/lib/domain/reasonPopover";
import { keepShown, summarise, toggleAll, toggleOne } from "@/lib/domain/selection";
import { AiSearchPanel } from "./AiSearchPanel";
import { ReasonInfo } from "./ReasonInfo";
import { SuggestedFilters } from "./SuggestedFilters";
import { ScoredCard } from "./ScoreInputs";

export type ApplicantRow = {
  id: string;
  card: Card;
  initialScores: Record<string, number>;
  coverageText: string;
  marked: boolean;
};

type Props = { rows: ApplicantRow[]; slotsLeft: number; minCovered: number; markedOnly: boolean; minWeighted?: number };
type Notice = { kind: "error"; text: string } | null;
type Section = { label?: string; ids: string[] };

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

function inviteMessage(invited: number, alreadyInvited: number): string {
  if (invited === 0) return `${plural(alreadyInvited, "applicant")} already invited. Nothing changed.`;
  const fresh = `${plural(invited, "new invite")} sent. Invited applicants move to Meetings.`;
  return alreadyInvited > 0 ? `${alreadyInvited} already invited, ${fresh}` : fresh;
}

function markMessage(count: number, marked: boolean): string {
  return marked
    ? `Marked ${plural(count, "applicant")} for later. Find them under "Marked for later" above the list.`
    : `Unmarked ${plural(count, "applicant")}.`;
}

/** No AI filter: the whole list. Otherwise only applicants every filter matches, in sections when a request asked for groups. */
function sectionsFor(rows: ApplicantRow[], filters: readonly ActiveFilter[]): Section[] {
  const matched = applyFilters(rows.map((r) => r.id), filters);
  const groups = sectionGroups(filters);
  if (!groups) return [{ ids: matched }];
  return groups
    .map((g) => ({ label: g.label, ids: matched.filter((id) => g.applicant_ids.includes(id)) }))
    .filter((section) => section.ids.length > 0);
}

export function ApplicantList({ rows, slotsLeft, minCovered, markedOnly, minWeighted }: Props) {
  const router = useRouter();
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<ActiveFilter[]>([]);
  const [popover, dispatch] = useReducer(popoverReducer, CLOSED);
  const searchCount = useRef(0);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, start] = useTransition();
  const { toast, showToast, dismissToast } = useToast();

  const byId = new Map(rows.map((r) => [r.id, r]));
  const sections = sectionsFor(rows, filters);
  const shownIds = sections.flatMap((s) => s.ids);
  const selected = keepShown(picked, shownIds);
  const summary = summarise(selected, shownIds);
  const ids = [...selected];

  // Changing the filters changes what is shown, so the selection starts empty again.
  const changeFilters = (next: ActiveFilter[]) => {
    setFilters(next);
    setPicked(new Set());
    setNotice(null);
    dispatch({ type: "close" });
  };
  const addSearch = (query: string, result: SearchResult) => {
    searchCount.current += 1;
    changeFilters(addFilter(filters, fromSearch(`search-${searchCount.current}`, query, result)));
  };
  const addSuggested = (filter: SuggestedFilter) => changeFilters(addFilter(filters, fromSuggested(filter)));

  const invite = () => {
    if (ids.length > 1 && !window.confirm(`Invite ${ids.length} applicants to the meeting?`)) return;
    start(async () => {
      const status = await inviteSelectedAction(ids);
      // A refused invite (e.g. not enough free slots) stays until the next action; a sent one is a passing confirmation.
      if (status.ok) {
        setNotice(null);
        showToast(inviteMessage(status.invited, status.alreadyInvited));
        setPicked(new Set());
      } else {
        setNotice({ kind: "error", text: status.error });
      }
      router.refresh();
    });
  };

  const mark = (marked: boolean) =>
    start(async () => {
      const status = await markForLaterAction(ids, marked);
      // Success is a passing confirmation (the row tag shows the lasting state); a failure stays until the next action.
      if (status.ok) {
        setNotice(null);
        showToast(markMessage(ids.length, marked));
      } else {
        setNotice({ kind: "error", text: status.error });
      }
      router.refresh();
    });

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SuggestedFilters shownIds={rows.map((r) => r.id)} activeIds={new Set(filters.map((f) => f.id))} onApply={addSuggested} />
        <span className="hint">Or describe what you are looking for below.</span>
      </div>

      <AiSearchPanel minCovered={minCovered} markedOnly={markedOnly} minWeighted={minWeighted} disabled={rows.length === 0} onResult={addSearch} />

      {filters.length > 0 && (
        <div className="ai-panel mt-6 space-y-3" role="status">
          <div className="flex flex-wrap items-center gap-2">
            <span className="tag tag-ai">AI filters</span>
            {filters.map((f) => (
              <span key={f.id} className="chip" title={f.note || undefined}>
                {f.label}
                <button
                  type="button"
                  className="-mr-1 rounded px-1 text-muted hover:text-ink"
                  aria-label={`Remove filter: ${f.label}`}
                  onClick={() => changeFilters(removeFilter(filters, f.id))}
                >
                  ×
                </button>
              </span>
            ))}
            <button type="button" className="btn btn-sm ml-auto" onClick={() => changeFilters([])}>
              Clear all filters
            </button>
          </div>
          {filters
            .filter((f) => f.source === "search")
            .map((f) => (
              <p key={f.id}>
                <span className="font-semibold">The AI looked for: </span>
                {f.note}
              </p>
            ))}
          <p className="hint">{matchLine(summary.total, filters.length)}. Check their cards before you decide.</p>
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
        <p role="alert" className="notice notice-error mt-3">
          {notice.text}
        </p>
      )}

      <ToastView toast={toast} onDismiss={dismissToast} />

      {shownIds.length === 0 ? (
        <p className="empty-slot mt-6">
          {filters.length > 0
            ? "No applicants match all the AI filters. Remove a filter or clear all to see everyone."
            : markedOnly
              ? "Nobody is marked for later. Tick applicants under All applicants and press Mark for later."
              : "No applicants match. Try a lower coverage."}
        </p>
      ) : (
        sections.map((section, s) => (
          <section key={s} className="mt-6" aria-label={section.label}>
            {section.label && <h2 className="h3 mb-3">{section.label} <span className="hint">({section.ids.length})</span></h2>}
            <ul className="space-y-6">
              {section.ids.map((id) => {
                const row = byId.get(id);
                if (!row) return null;
                const key = `${s}-${id}`;
                return (
                  <li key={key}>
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <label className="choice">
                        <input type="checkbox" checked={selected.has(id)} onChange={(e) => setPicked(toggleOne(selected, id, e.target.checked))} />
                        Select {row.card.label}
                      </label>
                      <ReasonInfo popoverKey={key} reasons={reasonsFor(id, filters)} open={popover.key === key} dispatch={dispatch} />
                      {row.marked && <span className="tag tag-accent">Marked for later</span>}
                    </div>
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
