import type { Card } from "@/lib/domain/cards";

export type EvidenceCardProps = {
  card: Card;
  scores?: Record<string, number>;
  onScore?: (requirementId: string, value: number) => void;
};

const SCORE_VALUES = Array.from({ length: 11 }, (_, i) => i);

function ScoreSelect({ id, label, value, onScore }: { id: string; label: string; value?: number; onScore: (v: number) => void }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <label htmlFor={id} className="text-sm text-neutral-800">
        Your score for {label}
      </label>
      <select
        id={id}
        value={value === undefined ? "" : String(value)}
        onChange={(e) => e.target.value !== "" && onScore(Number(e.target.value))}
        className="min-h-11 rounded border border-neutral-700 bg-white px-2 text-neutral-900"
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

/** Anonymous evidence card: each core requirement next to the applicant's own example. */
export function EvidenceCard({ card, scores, onScore }: EvidenceCardProps) {
  return (
    <article className="rounded border border-neutral-400 p-4">
      <h2 className="text-lg font-semibold">{card.label}</h2>
      <ul className="mt-3 space-y-4">
        {card.slots.map((slot) => (
          <li key={slot.requirement.id}>
            <h3 className="font-medium">{slot.requirement.text}</h3>
            {slot.examples.length === 0 ? (
              <p className="mt-1 text-neutral-700">No example yet</p>
            ) : (
              slot.examples.map((ex) => (
                <div key={ex.story.id} className="mt-1">
                  <p className="font-medium">{ex.story.title}</p>
                  <p className="text-neutral-900">{ex.story.body}</p>
                  <p className="mt-1 text-sm text-neutral-700">
                    Linked by applicant{ex.story.languageLabel ? ` · ${ex.story.languageLabel}` : ""}
                  </p>
                </div>
              ))
            )}
            {onScore && (
              <ScoreSelect
                id={`score-${card.applicantId}-${slot.requirement.id}`}
                label={slot.requirement.text}
                value={scores?.[slot.requirement.id]}
                onScore={(v) => onScore(slot.requirement.id, v)}
              />
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}
