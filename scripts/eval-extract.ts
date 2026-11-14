// Prompt-tuning harness for lib/ai/prompts/extractRequirements.ts.
// Runs extractRequirements on fictional job ads and prints each result next to simple checks.
// Usage: AI_PROVIDER=google|anthropic|openai npm run ai:eval-extract   (keys from .env)
// All ads below are fictional (synthetic data rule); companies end in "(fictional)".
import { extractRequirements } from "@/lib/ai/functions";
import { MAX_REQUIREMENT_PHRASES } from "@/lib/ai/guardrails";

type Case = {
  name: string;
  ad: string;
  /** Words that must appear in at least one phrase (the ad clearly states them). */
  mustMention: string[];
  /** Words that must NOT appear: perks, company blurb, or things the ad never asks for. */
  mustNotMention: string[];
};

const CASES: Case[] = [
  {
    name: "bullet list (demo)",
    ad: ["- Debugging embedded systems", "- Explaining tech to non-technical staff", "- Working with suppliers", "- Python"].join("\n"),
    mustMention: ["debug", "supplier", "python"],
    mustNotMention: [],
  },
  {
    name: "prose ad with perks and blurb",
    ad: [
      "Kestrel Logistics Oy (fictional) is a fast-growing warehouse company in Espoo with a great team spirit.",
      "We are looking for a Warehouse Shift Lead. You will plan daily shifts for a team of 12, keep the forklift fleet safe,",
      "and report stock levels in our warehouse system every morning. You must hold a valid forklift licence.",
      "Finnish or English is fine at work. We offer free lunch, a gym benefit and flexible hours.",
    ].join(" "),
    mustMention: ["shift", "forklift", "stock"],
    mustNotMention: ["lunch", "gym", "team spirit", "fast-growing"],
  },
  {
    name: "wishlist with nice-to-haves",
    ad: [
      "Junior Data Analyst, Fjordline Analytics Oy (fictional).",
      "Requirements: SQL for everyday queries; building dashboards; explaining numbers to sales colleagues.",
      "Nice to have: Python, experience with cloud tools.",
      "We value curiosity and a can-do attitude.",
    ].join("\n"),
    mustMention: ["sql", "dashboard", "explain"],
    mustNotMention: ["degree", "years"],
  },
  {
    name: "ad containing identity and scoring bait",
    ad: [
      "Customer Support Agent, Pinecrest Services Oy (fictional).",
      "Ideal candidate: native Finnish speaker, under 30, top 10% of applicants, degree from a well-known university.",
      "Tasks: answer customer emails and calls, log tickets, hand over technical issues to the IT team.",
    ].join("\n"),
    mustMention: ["email", "ticket"],
    mustNotMention: ["native", "under 30", "top 10", "university"],
  },
];

function check(c: Case, phrases: string[]): string[] {
  const text = phrases.join(" | ").toLowerCase();
  const problems: string[] = [];
  for (const w of c.mustMention) if (!text.includes(w)) problems.push(`missing "${w}"`);
  for (const w of c.mustNotMention) if (text.includes(w)) problems.push(`should not contain "${w}"`);
  if (phrases.length > MAX_REQUIREMENT_PHRASES) problems.push(`too many phrases (${phrases.length})`);
  const long = phrases.filter((p) => p.split(/\s+/).length > 8);
  if (long.length > 0) problems.push(`${long.length} phrase(s) longer than 8 words`);
  return problems;
}

async function main(): Promise<void> {
  console.log(`provider: ${process.env.AI_PROVIDER ?? "mock"}  model: ${process.env.AI_MODEL || "(default)"}`);
  let failed = 0;
  for (const c of CASES) {
    const result = await extractRequirements(c.ad);
    const problems = check(c, result.value);
    if (problems.length > 0) failed++;
    console.log(`\n== ${c.name} == source: ${result.source}`);
    result.value.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));
    console.log(problems.length === 0 ? "  OK" : `  CHECK: ${problems.join("; ")}`);
  }
  console.log(`\n${CASES.length - failed}/${CASES.length} cases pass`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
