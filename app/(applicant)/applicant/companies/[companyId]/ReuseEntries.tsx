import { buttonClass } from "../../stories/ui";
import { usedForLabel, type MatchView } from "../ui";

const PREVIEW_CHARS = 160;
const preview = (body: string) => (body.length > PREVIEW_CHARS ? `${body.slice(0, PREVIEW_CHARS).trimEnd()}…` : body);

function reason(m: MatchView): string {
  if (m.kind === "same") {
    const where = m.usedFor.map(usedForLabel).join(", ");
    return `Same requirement at ${where || "another company"}`;
  }
  return `Similar: both mention ${m.sharedWords.join(", ")}`;
}

function Row({ match, busy, onUse }: { match: MatchView; busy: boolean; onUse: (entryId: string) => void }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 py-3">
      <div className="min-w-0 flex-1">
        {match.kind !== "other" ? <p><span className="tag tag-accent">{reason(match)}</span></p> : null}
        <p className="mt-1 text-[0.9375rem]">{preview(match.body)}</p>
        {match.kind === "other" && match.usedFor.length > 0 ? (
          <p className="hint mt-1">Used for: {match.usedFor.map(usedForLabel).join(", ")}</p>
        ) : null}
      </div>
      <button type="button" className={`${buttonClass} btn-sm`} disabled={busy} onClick={() => onUse(match.entryId)}>Use this</button>
    </li>
  );
}

/** Reusing points the card at an entry as written; it is never rewritten. */
export function ReuseEntries({ matches, busy, onUse }: { matches: MatchView[]; busy: boolean; onUse: (entryId: string) => void }) {
  if (matches.length === 0) return null;
  const open = matches.filter((m) => m.kind !== "other");
  const other = matches.filter((m) => m.kind === "other");
  return (
    <section className="mt-5 border-t border-line pt-4" aria-label="Reuse a saved entry">
      <h3 className="label">Reuse a saved entry</h3>
      {open.length > 0 ? <ul className="mt-1 divide-y divide-line">{open.map((m) => <Row key={m.entryId} match={m} busy={busy} onUse={onUse} />)}</ul> : null}
      {other.length > 0 ? (
        <details className="mt-2">
          <summary className="link cursor-pointer">Other saved entries</summary>
          <ul className="mt-1 divide-y divide-line">{other.map((m) => <Row key={m.entryId} match={m} busy={busy} onUse={onUse} />)}</ul>
        </details>
      ) : null}
    </section>
  );
}
