import { describe, expect, test } from "vitest";
import {
  cleanSearchResult,
  cleanLanguageText,
  cleanLinkSuggestions,
  cleanQuestion,
  cleanExtractedRequirements,
  isQuotedFrom,
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

const AD = "We need Python, SQL and dashboards. You will build weekly sales reports for managers.";
const grounded = (text: string, inPractice = "") => ({ text, inPractice, evidence: "Python, SQL" });
const cleanTitles = (texts: string[]) =>
  cleanExtractedRequirements(texts.map((t) => grounded(t)), AD).map((r) => r.text);

describe("isQuotedFrom", () => {
  test("finds the quote despite case, spacing, punctuation and quote styles", () => {
    expect(isQuotedFrom("python,  sql AND Dashboards", AD)).toBe(true);
    expect(isQuotedFrom("“weekly sales reports”", AD)).toBe(true);
  });

  test("rejects a quote that is not in the ad, a partial word, or an empty quote", () => {
    expect(isQuotedFrom("Kubernetes clusters", AD)).toBe(false);
    expect(isQuotedFrom("ytho", AD)).toBe(false);
    expect(isQuotedFrom("  ", AD)).toBe(false);
  });
});

describe("cleanExtractedRequirements", () => {
  test("drops items whose evidence is not in the ad and hides evidence from the result", () => {
    const out = cleanExtractedRequirements(
      [
        { text: "Business reporting", inPractice: "Weekly sales reports.", evidence: "weekly sales reports" },
        { text: "Kubernetes", inPractice: "", evidence: "deploy on Kubernetes" },
      ],
      AD,
    );
    expect(out).toEqual([{ text: "Business reporting", inPractice: "Weekly sales reports." }]);
  });

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
    const out = cleanTitles(["Ranked list maintenance", "Reduce costs by 20%", "Rating system integration"]);
    expect(out).toHaveLength(3);
  });

  test("trims, drops blanks and caps at 15", () => {
    const many = Array.from({ length: 20 }, (_, i) => ` Skill ${i} `);
    const out = cleanTitles(["", "  ", ...many]);
    expect(out).toHaveLength(15);
    expect(out[0]).toBe("Skill 0");
  });

  test("drops duplicate titles regardless of case, keeping the first", () => {
    const out = cleanExtractedRequirements([grounded("Python", "Small scripts."), grounded(" python ", "Other.")], AD);
    expect(out).toEqual([{ text: "Python", inPractice: "Small scripts." }]);
  });

  test("keeps the title but blanks an inPractice line that scores a person", () => {
    const out = cleanExtractedRequirements([grounded("SQL", "Top candidates write SQL daily.")], AD);
    expect(out).toEqual([{ text: "SQL", inPractice: "" }]);
  });

  test("blanks an inPractice line over the length cap and trims the rest", () => {
    const out = cleanExtractedRequirements(
      [grounded("SQL", "x".repeat(MAX_IN_PRACTICE_LENGTH + 1)), grounded("Dashboards", "  Weekly sales dashboards.  ")],
      AD,
    );
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

describe("cleanSearchResult", () => {
  const aliases = { A1: "talent-017", A2: "talent-020" };
  const group = (applicants: { id: string; reason: string }[], label = "Python evidence") => ({ label, applicants });

  test("cleanSearchResult_unknownAndPrototypeIds_dropped", () => {
    const out = cleanSearchResult(
      { interpretation: "Python.", groups: [group([{ id: "A1", reason: "r" }, { id: "A7", reason: "r" }, { id: "constructor", reason: "r" }])] },
      aliases,
    );
    expect(out?.groups).toEqual([{ label: "Python evidence", applicant_ids: ["talent-017"], reason_per_applicant: { "talent-017": "r" } }]);
  });

  test("cleanSearchResult_duplicateInGroup_keptOnce", () => {
    const out = cleanSearchResult({ interpretation: "x", groups: [group([{ id: "A1", reason: "a" }, { id: "A1", reason: "b" }])] }, aliases);
    expect(out?.groups[0].applicant_ids).toEqual(["talent-017"]);
  });

  test("cleanSearchResult_longReason_cutTo25Words", () => {
    const long = Array.from({ length: 40 }, (_, i) => `w${i}`).join(" ");
    const out = cleanSearchResult({ interpretation: "x", groups: [group([{ id: "A1", reason: long }])] }, aliases);
    expect(out?.groups[0].reason_per_applicant["talent-017"].split(" ")).toHaveLength(25);
  });

  test("cleanSearchResult_rankingLabelOrReason_dropped", () => {
    const out = cleanSearchResult(
      {
        interpretation: "x",
        groups: [group([{ id: "A1", reason: "r" }], "Top candidates"), group([{ id: "A2", reason: "Best match for the role" }])],
      },
      aliases,
    );
    expect(out?.groups).toEqual([]);
  });

  test("cleanSearchResult_cannotAnswerFromCards_noGroupsIsValid", () =>
    expect(cleanSearchResult({ interpretation: "Scores of applicants are not in the cards, so I cannot answer.", groups: [] }, aliases)).toEqual({
      interpretation: "Scores of applicants are not in the cards, so I cannot answer.",
      groups: [],
    }));

  test("cleanSearchResult_missingInterpretation_rejected", () =>
    expect(cleanSearchResult({ interpretation: " ", groups: [] }, aliases)).toBeNull());

  test("cleanSearchResult_applicantInTwoGroups_allowed", () => {
    const out = cleanSearchResult(
      { interpretation: "x", groups: [group([{ id: "A1", reason: "a" }], "Python"), group([{ id: "A1", reason: "b" }], "SQL")] },
      aliases,
    );
    expect(out?.groups.map((g) => g.applicant_ids)).toEqual([["talent-017"], ["talent-017"]]);
  });
});
