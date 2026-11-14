import { describe, expect, test } from "vitest";
import { cleanLinkSuggestions, cleanQuestion, labelFor } from "./guardrails";

const reqs = [{ id: "req-01-1" }, { id: "req-01-2" }];
const many = [
  { id: "r1" },
  { id: "r2" },
  { id: "r3" },
  { id: "r4" },
  { id: "r5" },
];
const fiveValid = many.map((r) => ({ requirementId: r.id, reason: "You wrote about this." }));

describe("cleanLinkSuggestions", () => {
  test("drops suggestions for unknown requirements and caps at 3", () => {
    expect(
      cleanLinkSuggestions([...fiveValid, { requirementId: "req-99", reason: "x" }], many),
    ).toHaveLength(3);
    expect(cleanLinkSuggestions([{ requirementId: "req-99", reason: "x" }], reqs)).toEqual([]);
  });

  test("drops reasons that score or rate", () => {
    for (const reason of ["85% match for this role", "high score", "top rating", "ranks first", "best match"]) {
      expect(cleanLinkSuggestions([{ requirementId: "req-01-1", reason }], reqs)).toEqual([]);
    }
  });

  test("drops empty or overlong reasons", () => {
    expect(cleanLinkSuggestions([{ requirementId: "req-01-1", reason: "  " }], reqs)).toEqual([]);
    expect(
      cleanLinkSuggestions([{ requirementId: "req-01-1", reason: "a".repeat(241) }], reqs),
    ).toEqual([]);
  });

  test("drops duplicate requirements keeping the first", () => {
    const out = cleanLinkSuggestions(
      [
        { requirementId: "req-01-1", reason: "first" },
        { requirementId: "req-01-1", reason: "second" },
      ],
      reqs,
    );
    expect(out).toEqual([{ requirementId: "req-01-1", reason: "first" }]);
  });
});

describe("cleanQuestion", () => {
  test("accepts exactly one question", () => {
    expect(cleanQuestion("What did you do yourself?")).toBe("What did you do yourself?");
    expect(cleanQuestion("What happened? And who helped?")).toBeNull();
    expect(cleanQuestion("Great story! You should say you led the team.")).toBeNull();
  });

  test("rejects questions over 200 characters", () => {
    expect(cleanQuestion(`${"a".repeat(200)}?`)).toBeNull();
  });
});

describe("labelFor", () => {
  test("label is set in code, not by the model", () => {
    expect(labelFor("grammar")).toBe("language edited");
    expect(labelFor("translate", "Ukrainian")).toBe("translated from Ukrainian");
  });
});
