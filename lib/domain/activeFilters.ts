import type { SearchGroup, SearchResult, SuggestedFilter } from "@/lib/ai/guardrails";

/**
 * One AI filter the recruiter applied: a suggested filter or a free-text request. Both have the same
 * shape. A free-text request can come back as several groups ("group them by requirement"), so a filter
 * holds groups; an applicant matches the filter when they are in any of its groups.
 */
export type ActiveFilter = {
  id: string;
  label: string;
  source: "suggested" | "search";
  /** The AI's restatement of a free-text request, or what a suggested filter checks. */
  note: string;
  groups: SearchGroup[];
};

export type FilterReason = { label: string; reason: string };

export function fromSearch(id: string, query: string, result: SearchResult): ActiveFilter {
  return { id, label: query.trim(), source: "search", note: result.interpretation, groups: result.groups };
}

/** Keyed by label: ids restart at each refresh, a label means the same check across refreshes. */
export const suggestedFilterId = (filter: Pick<SuggestedFilter, "label">) => `suggested:${filter.label.toLowerCase()}`;

export function fromSuggested(filter: SuggestedFilter): ActiveFilter {
  const group = { label: filter.label, applicant_ids: filter.applicant_ids, reason_per_applicant: filter.reason_per_applicant };
  return { id: suggestedFilterId(filter), label: filter.label, source: "suggested", note: filter.description, groups: [group] };
}

export function matchingIds(filter: ActiveFilter): Set<string> {
  return new Set(filter.groups.flatMap((g) => g.applicant_ids));
}

/** Adds a filter on top of the others; the same suggested filter twice is a no-op. */
export function addFilter(filters: readonly ActiveFilter[], next: ActiveFilter): ActiveFilter[] {
  return filters.some((f) => f.id === next.id) ? [...filters] : [...filters, next];
}

export function removeFilter(filters: readonly ActiveFilter[], id: string): ActiveFilter[] {
  return filters.filter((f) => f.id !== id);
}

/** AND: an applicant is shown only when every active filter matches them. Keeps the list order. */
export function applyFilters(ids: readonly string[], filters: readonly ActiveFilter[]): string[] {
  const sets = filters.map(matchingIds);
  return ids.filter((id) => sets.every((set) => set.has(id)));
}

/** Every reason the applicant has across the active filters, labelled by filter (and group when there are several). */
export function reasonsFor(id: string, filters: readonly ActiveFilter[]): FilterReason[] {
  return filters.flatMap((f) =>
    f.groups
      .filter((g) => g.reason_per_applicant[id])
      .map((g) => ({
        label: f.groups.length > 1 ? `${f.label}: ${g.label}` : f.label,
        reason: g.reason_per_applicant[id],
      })),
  );
}

/**
 * "8 of 12 applicants match all 2 filters; 4 are hidden". The AI decides who matches, so the
 * recruiter always sees how many people the filters hide, not only who is left.
 */
export function matchLine(count: number, filterCount: number, listCount: number): string {
  const people = `${count} of ${listCount} applicant${listCount === 1 ? "" : "s"}`;
  const verb = count === 1 ? "matches" : "match";
  const hidden = listCount - count;
  const hiddenNote = hidden > 0 ? `; ${hidden} ${hidden === 1 ? "is" : "are"} hidden` : "";
  return `${people} ${verb} ${filterCount === 1 ? "the filter" : `all ${filterCount} filters`}${hiddenNote}`;
}

/** The latest free-text filter that came back as several groups decides the sections; otherwise one list. */
export function sectionGroups(filters: readonly ActiveFilter[]): SearchGroup[] | null {
  const grouped = [...filters].reverse().find((f) => f.groups.length > 1);
  return grouped ? grouped.groups : null;
}
