/** Pure selection helpers for the recruiter's applicant list. Selection only ever holds ids that are shown. */

export function toggleOne(selected: ReadonlySet<string>, id: string, on: boolean): Set<string> {
  const next = new Set(selected);
  if (on) next.add(id);
  else next.delete(id);
  return next;
}

/** "Select all" ticks every shown applicant; unticking it clears them. */
export function toggleAll(shown: readonly string[], on: boolean): Set<string> {
  return on ? new Set(shown) : new Set();
}

/** Drops ids that are no longer shown, e.g. after an invite moved them off the list. */
export function keepShown(selected: ReadonlySet<string>, shown: readonly string[]): Set<string> {
  const visible = new Set(shown);
  return new Set([...selected].filter((id) => visible.has(id)));
}

export type SelectionSummary = { count: number; total: number; all: boolean; some: boolean };

export function summarise(selected: ReadonlySet<string>, shown: readonly string[]): SelectionSummary {
  const unique = [...new Set(shown)];
  const count = unique.filter((id) => selected.has(id)).length;
  return { count, total: unique.length, all: unique.length > 0 && count === unique.length, some: count > 0 && count < unique.length };
}

/** The selected ids that are marked for later; Unmark acts only on these and is off when there are none. */
export function markedAmong(selected: ReadonlySet<string>, isMarked: (id: string) => boolean): string[] {
  return [...selected].filter(isMarked);
}
