import { describe, expect, test } from "vitest";
import { makeDb } from "@/lib/domain/fixtures";
import { buildSearchInput } from "./searchInput";

const COMPANY = "company-01";

describe("buildSearchInput", () => {
  test("buildSearchInput_cards_containNoIdentityOrIds", () => {
    const input = buildSearchInput(makeDb(), COMPANY, ["talent-017", "talent-020"], "python");
    const sent = JSON.stringify({ cards: input.cards, requirements: input.requirements, query: input.query });
    for (const leak of ["talent-017", "talent-020", "Applicant 017", "Demo Person 017", "example.org"]) {
      expect(sent).not.toContain(leak);
    }
  });

  test("buildSearchInput_aliases_followListOrderAndMapBack", () => {
    const input = buildSearchInput(makeDb(), COMPANY, ["talent-020", "talent-017"], "python");
    expect(input.cards.map((c) => c.alias)).toEqual(["A1", "A2"]);
    expect(input.aliases).toEqual({ A1: "talent-020", A2: "talent-017" });
  });

  test("buildSearchInput_examples_onlyAnsweredCoreRequirements", () => {
    const input = buildSearchInput(makeDb(), COMPANY, ["talent-017", "talent-020"], "python");
    expect(input.cards[0].examples).toEqual([{ requirementId: "req-01-2", body: "Body of story-017-a" }]);
    expect(input.cards[1].examples.map((e) => e.requirementId)).toEqual(["req-01-1", "req-01-3", "req-01-4"]);
    expect(input.requirements.map((r) => r.id)).toEqual(["req-01-1", "req-01-2", "req-01-3", "req-01-4"]);
  });

  test("buildSearchInput_emptyList_sendsNoCards", () => {
    const input = buildSearchInput(makeDb(), COMPANY, [], "python");
    expect(input.cards).toEqual([]);
    expect(input.aliases).toEqual({});
  });
});
