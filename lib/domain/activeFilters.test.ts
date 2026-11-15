import { describe, expect, test } from "vitest";
import {
  addFilter,
  applyFilters,
  fromSearch,
  matchLine,
  reasonsFor,
  removeFilter,
  sectionGroups,
  type ActiveFilter,
} from "./activeFilters";

const filter = (id: string, ids: string[], label = id): ActiveFilter => ({
  id,
  label,
  source: "suggested",
  note: "",
  groups: [{ label, applicant_ids: ids, reason_per_applicant: Object.fromEntries(ids.map((x) => [x, `${label} reason for ${x}`])) }],
});

const LIST = ["a", "b", "c", "d"];

describe("active AI filters", () => {
  test("applyFilters_noFilters_showsWholeList", () => {
    expect(applyFilters(LIST, [])).toEqual(LIST);
  });

  test("applyFilters_twoFilters_combinesWithAnd", () => {
    expect(applyFilters(LIST, [filter("python", ["a", "b", "c"]), filter("supplier", ["b", "c", "d"])])).toEqual(["b", "c"]);
  });

  test("removeFilter_oneChip_onlyThatFilterGoes", () => {
    const filters = [filter("python", ["a", "b"]), filter("supplier", ["b", "d"])];
    const left = removeFilter(filters, "python");
    expect(left.map((f) => f.id)).toEqual(["supplier"]);
    expect(applyFilters(LIST, left)).toEqual(["b", "d"]);
  });

  test("clearAll_emptyFilters_wholeListBack", () => {
    expect(applyFilters(LIST, removeFilter(removeFilter([filter("x", ["a"]), filter("y", ["a"])], "x"), "y"))).toEqual(LIST);
  });

  test("addFilter_freeTextSearch_addsChipInsteadOfReplacing", () => {
    const suggested = [filter("python", ["a", "b"])];
    const search = fromSearch("search-1", "  has supplier work ", {
      interpretation: "Cards with supplier work.",
      groups: [{ label: "Supplier work", applicant_ids: ["b"], reason_per_applicant: { b: 'Wrote "negotiated with suppliers".' } }],
    });
    const next = addFilter(suggested, search);
    expect(next.map((f) => f.id)).toEqual(["python", "search-1"]);
    expect(next[1]).toMatchObject({ label: "has supplier work", source: "search", note: "Cards with supplier work." });
    expect(applyFilters(LIST, next)).toEqual(["b"]);
  });

  test("addFilter_sameSuggestionTwice_keepsOneChip", () => {
    expect(addFilter([filter("python", ["a"])], filter("python", ["a"]))).toHaveLength(1);
  });

  test("applyFilters_groupedSearch_matchesAnyOfItsGroups", () => {
    const grouped: ActiveFilter = {
      ...filter("g", []),
      groups: [
        { label: "Python", applicant_ids: ["a"], reason_per_applicant: { a: "x" } },
        { label: "SQL", applicant_ids: ["c"], reason_per_applicant: { c: "y" } },
      ],
    };
    expect(applyFilters(LIST, [grouped])).toEqual(["a", "c"]);
    expect(sectionGroups([filter("python", ["a"]), grouped])?.map((g) => g.label)).toEqual(["Python", "SQL"]);
    expect(sectionGroups([filter("python", ["a"])])).toBeNull();
  });

  test("reasonsFor_applicantInTwoFilters_reasonsGroupedByFilterLabel", () => {
    const filters = [filter("python", ["a", "b"], "Python evidence"), filter("supplier", ["b"], "Supplier work")];
    expect(reasonsFor("b", filters)).toEqual([
      { label: "Python evidence", reason: "Python evidence reason for b" },
      { label: "Supplier work", reason: "Supplier work reason for b" },
    ]);
    expect(reasonsFor("d", filters)).toEqual([]);
  });

  test("matchLine_counts_readsNaturally", () => {
    expect(matchLine(8, 2)).toBe("8 applicants match all 2 filters");
    expect(matchLine(1, 1)).toBe("1 applicant matches the filter");
  });
});
