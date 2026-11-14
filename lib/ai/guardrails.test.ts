import { describe, expect, test } from "vitest";
import {
  cleanLanguageText,
  cleanLinkSuggestions,
  cleanQuestion,
  cleanExtractedRequirements,
  MAX_IN_PRACTICE_LENGTH,
  labelFor,
} from "./guardrails";

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
    expect(cleanQuestion("What did you do yourself?", "story")).toBe("What did you do yourself?");
    expect(cleanQuestion("What happened? And who helped?", "story")).toBeNull();
    expect(cleanQuestion("Great story! You should say you led the team.", "story")).toBeNull();
  });

  test("rejects questions over 200 characters", () => {
    expect(cleanQuestion(`${"a".repeat(200)}?`, "story")).toBeNull();
  });
});

describe("cleanQuestion scoring language", () => {
  test("rejects a question that adds a score, rating, rank or percentage", () => {
    expect(cleanQuestion("What score would you give yourself?", "I fixed a fault.")).toBeNull();
    expect(cleanQuestion("Why do you think you rank 90% here?", "I fixed a fault.")).toBeNull();
  });

  test("accepts a normal recall question", () => {
    const q = "What did you do yourself?";
    expect(cleanQuestion(q, "I fixed a fault.")).toBe(q);
  });

  test("accepts a question quoting a percentage from the applicant's own story", () => {
    const q = "How did you get the defect rate down by 30%?";
    expect(cleanQuestion(q, "I cut the defect rate by 30% in a month.")).toBe(q);
  });
});

describe("cleanLanguageText", () => {
  test("returns the trimmed text when it is clean", () => {
    expect(cleanLanguageText(" Hei maailma ", "Hello world")).toBe("Hei maailma");
  });

  test("rejects empty output and output that adds scoring language", () => {
    expect(cleanLanguageText("  ", "Hello")).toBeNull();
    expect(cleanLanguageText("Hello. Match score 90%.", "Hello")).toBeNull();
  });

  test("keeps scoring words the applicant wrote themselves", () => {
    const input = "I kept the ranked list of tickets up to date.";
    expect(cleanLanguageText(input, input)).toBe(input);
  });
});

const titles = (texts: string[]) => texts.map((text) => ({ text, inPractice: "" }));
const cleanTitles = (texts: string[]) => cleanExtractedRequirements(titles(texts)).map((r) => r.text);

describe("cleanExtractedRequirements", () => {
  test("drops phrases that score or rate a person", () => {
    const out = cleanTitles([
      "Python",
      "Candidate score above 80%",
      "Rank applicants by experience",
      "Rating of the candidate",
      "Best match for the team",
      "Fit score of 70",
      "90% fit for the role",
      "Top candidates only",
      "Compare applicants",
      "Hire rating",
      "Rank employees by output",
    ]);
    expect(out).toEqual(["Python"]);
  });

  test("keeps job content that merely uses the words", () => {
    const out = cleanTitles([
      "Ranked list maintenance",
      "Reduce costs by 20%",
      "Rating system integration",
    ]);
    expect(out).toHaveLength(3);
  });

  test("trims, drops blanks and caps at 15", () => {
    const many15 = Array.from({ length: 20 }, (_, i) => ` Skill ${i} `);
    const out = cleanTitles(["", "  ", ...many15]);
    expect(out).toHaveLength(15);
    expect(out[0]).toBe("Skill 0");
  });

  test("drops duplicate titles regardless of case, keeping the first", () => {
    const out = cleanExtractedRequirements([
      { text: "Python", inPractice: "Small scripts." },
      { text: " python ", inPractice: "Other." },
    ]);
    expect(out).toEqual([{ text: "Python", inPractice: "Small scripts." }]);
  });

  test("keeps the title but blanks an inPractice line that scores a person", () => {
    const out = cleanExtractedRequirements([{ text: "SQL", inPractice: "Top candidates write SQL daily." }]);
    expect(out).toEqual([{ text: "SQL", inPractice: "" }]);
  });

  test("blanks an inPractice line over the length cap and trims the rest", () => {
    const out = cleanExtractedRequirements([
      { text: "SQL", inPractice: "x".repeat(MAX_IN_PRACTICE_LENGTH + 1) },
      { text: "Dashboards", inPractice: "  Weekly sales dashboards.  " },
    ]);
    expect(out).toEqual([
      { text: "SQL", inPractice: "" },
      { text: "Dashboards", inPractice: "Weekly sales dashboards." },
    ]);
  });
});

describe("labelFor", () => {
  test("label is set in code, not by the model", () => {
    expect(labelFor("grammar")).toBe("language edited");
    expect(labelFor("translate", "Ukrainian")).toBe("translated from Ukrainian");
  });
});
