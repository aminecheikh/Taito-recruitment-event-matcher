import { describe, expect, test, vi } from "vitest";
import { cleanSuggestedFilters, type RawSuggestedFilters } from "./guardrails";
import { createSuggestionCache } from "./suggestionCache";

const ALIASES = { A1: "talent-1", A2: "talent-2", A3: "talent-3" };
const raw = (filters: RawSuggestedFilters["suggested_filters"]): RawSuggestedFilters => ({ suggested_filters: filters });
const match = (...ids: string[]) => ids.map((id) => ({ id, reason: `Wrote "example by ${id}".` }));

describe("cleanSuggestedFilters", () => {
  test("cleanSuggested_validFilter_mapsAliasesAndAssignsIds", () => {
    expect(cleanSuggestedFilters(raw([{ label: "Has supplier negotiation example", description: "Cards with supplier work.", applicants: match("A1", "A3") }]), ALIASES, 3)).toEqual([
      {
        id: "suggested-1",
        label: "Has supplier negotiation example",
        description: "Cards with supplier work.",
        applicant_ids: ["talent-1", "talent-3"],
        reason_per_applicant: { "talent-1": 'Wrote "example by A1".', "talent-3": 'Wrote "example by A3".' },
      },
    ]);
  });

  test("cleanSuggested_unknownIds_ignored", () => {
    const [kept] = cleanSuggestedFilters(raw([{ label: "Python work", description: "", applicants: match("A1", "A9", "__proto__") }]), ALIASES, 3);
    expect(kept.applicant_ids).toEqual(["talent-1"]);
  });

  test("cleanSuggested_matchesNoneOrEveryone_dropped", () => {
    const filters = raw([
      { label: "Nobody", description: "", applicants: match("A9") },
      { label: "Everyone", description: "", applicants: match("A1", "A2", "A3") },
      { label: "Some", description: "", applicants: match("A2") },
    ]);
    expect(cleanSuggestedFilters(filters, ALIASES, 3).map((f) => f.label)).toEqual(["Some"]);
  });

  test("cleanSuggested_scoringIdentityOrLongLabels_dropped", () => {
    const filters = raw([
      { label: "Top applicants", description: "", applicants: match("A1") },
      { label: "Native Finnish speakers", description: "", applicants: match("A1") },
      { label: "Graduated recently", description: "Studied at Aalto University", applicants: match("A1") },
      { label: "Has a very long label with too many words", description: "", applicants: match("A1") },
      { label: "Customer service in Finnish", description: "Examples serving customers in Finnish.", applicants: match("A1") },
    ]);
    expect(cleanSuggestedFilters(filters, ALIASES, 3).map((f) => f.label)).toEqual(["Customer service in Finnish"]);
  });

  test("cleanSuggested_moreThanTen_cappedAndDuplicatesDropped", () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ label: `Filter ${i % 11}`, description: "", applicants: match("A1") }));
    const kept = cleanSuggestedFilters(raw(many), ALIASES, 3);
    expect(kept).toHaveLength(10);
    expect(new Set(kept.map((f) => f.label)).size).toBe(10);
  });
});

describe("suggestion cache", () => {
  const answer = (source: "model" | "mock-fallback", n = 1) =>
    Promise.resolve({ source, value: Array.from({ length: n }, (_, i) => ({ id: `s${i}`, label: "x", description: "", applicant_ids: [], reason_per_applicant: {} })) });

  test("cache_secondRequest_reusesFirstAnswer", async () => {
    const cache = createSuggestionCache();
    const build = vi.fn(() => answer("model"));
    await cache.get("e:c", build);
    await cache.get("e:c", build);
    expect(build).toHaveBeenCalledTimes(1);
  });

  test("cache_refresh_buildsAgain", async () => {
    const cache = createSuggestionCache();
    const build = vi.fn(() => answer("model"));
    await cache.get("e:c", build);
    await cache.get("e:c", build, true);
    expect(build).toHaveBeenCalledTimes(2);
  });

  test("cache_failedOrEmptyAnswer_notKept", async () => {
    const cache = createSuggestionCache();
    const failed = vi.fn(() => answer("mock-fallback"));
    await cache.get("e:c", failed);
    await cache.get("e:c", failed);
    expect(failed).toHaveBeenCalledTimes(2);
    const empty = vi.fn(() => answer("model", 0));
    await cache.get("e:d", empty);
    await cache.get("e:d", empty);
    expect(empty).toHaveBeenCalledTimes(2);
  });

  test("cache_otherCompany_separateEntry", async () => {
    const cache = createSuggestionCache();
    const build = vi.fn(() => answer("model"));
    await cache.get("e:c1", build);
    await cache.get("e:c2", build);
    expect(build).toHaveBeenCalledTimes(2);
  });
});
