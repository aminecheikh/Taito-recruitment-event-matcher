import type { Card } from "@/lib/domain/cards";

export type EvidenceCardProps = {
  card: Card;
  scores?: Record<string, number>;
  onScore?: (requirementId: string, value: number) => void;
  /** Small status shown next to the card title, e.g. coverage. */
  meta?: React.ReactNode;
  /** Actions row attached to the bottom of the card. */
  footer?: React.ReactNode;
};

const SCORE_VALUES = Array.from({ length: 11 }, (_, i) => i);

function ScoreSelect({ id, label, value, onScore }: { id: string; label: string; value?: number; onScore: (v: number) => void }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <label htmlFor={id} className="hint">
        Your score for {label}
      </label>
      <select
        id={id}
        value={value === undefined ? "" : String(value)}
        onChange={(e) => e.target.value !== "" && onScore(Number(e.target.value))}
        className="field field-inline"
      >
        <option value="">Not scored</option>
        {SCORE_VALUES.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Anonymous evidence card: each core requirement (left) next to the applicant's own example (right). */
export function EvidenceCard({ card, scores, onScore, meta, footer }: EvidenceCardProps) {
  return (
    <article className="card">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="h2">{card.label}</h2>
        {meta}
      </header>
      <ol className="mt-4 divide-y divide-line border-t border-line">
        {card.slots.map((slot, index) => (
          <li key={slot.requirement.id} className="grid gap-3 py-5 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-8">
            <div>
              <p className="font-serif text-sm text-muted">#{index + 1}</p>
              <h3 className="h3">{slot.requirement.text}</h3>
              {slot.requirement.inPractice ? <p className="hint mt-1">In practice: {slot.requirement.inPractice}</p> : null}
            </div>
            <div>
              {slot.examples.length === 0 ? (
                <p className="empty-slot">No example yet</p>
              ) : (
                <div className="space-y-4">
                  {slot.examples.map((ex) => (
                    <div key={ex.story.id} className="border-l-2 border-accent pl-4">
                      <p className="font-semibold">{ex.story.title}</p>
                      <p className="mt-1 whitespace-pre-wrap text-[0.9375rem] leading-relaxed">{ex.story.body}</p>
                      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                        <span>Linked by applicant</span>
                        {ex.story.languageLabel ? <span className="tag tag-ai">{ex.story.languageLabel}</span> : null}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {onScore && (
                <ScoreSelect
                  id={`score-${card.applicantId}-${slot.requirement.id}`}
                  label={slot.requirement.text}
                  value={scores?.[slot.requirement.id]}
                  onScore={(v) => onScore(slot.requirement.id, v)}
                />
              )}
            </div>
          </li>
        ))}
      </ol>
      {footer ? (
        <div className="-mx-5 -mb-5 flex flex-wrap items-center justify-end gap-x-4 gap-y-2 rounded-b-xl border-t border-line bg-sunken px-5 py-3 sm:-mx-6 sm:-mb-6 sm:px-6">
          {footer}
        </div>
      ) : null}
    </article>
  );
}
