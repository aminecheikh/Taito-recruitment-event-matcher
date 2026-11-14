// Prompt-tuning harness for lib/ai/prompts/extractRequirements.ts.
// Runs extractRequirements on fictional job ads and prints each result next to simple checks.
// Usage: npm run ai:eval-extract   (provider, model and key from .env; "source: mock" means no AI is connected)
// All ads below are fictional (synthetic data rule); companies end in "(fictional)".
import { extractRequirements, type ExtractedRequirement } from "@/lib/ai/functions";
import { MAX_REQUIREMENT_PHRASES } from "@/lib/ai/guardrails";

type Case = {
  name: string;
  ad: string;
  /** Words that must appear in at least one requirement name or note (the ad clearly needs them). */
  mustMention: string[];
  /** Words that must NOT appear: perks, company blurb, identity traits, things the ad never asks for. */
  mustNotMention: string[];
};

const MAX_TITLE_WORDS = 10;
const MAX_IN_PRACTICE_CHARS = 300;
// A name that repeats this many consecutive words of the ad is copied, not inferred.
const COPIED_RUN_WORDS = 5;
const TASK_PHRASING = /^(you will|you'll|ability to|experience (with|in)|we )/i;

const CASES: Case[] = [
  {
    name: "bullet list (demo)",
    ad: ["- Debugging embedded systems", "- Explaining tech to non-technical staff", "- Working with suppliers", "- Python"].join("\n"),
    mustMention: ["debug", "supplier", "python"],
    mustNotMention: [],
  },
  {
    name: "task-only robotics ad (no stated requirements)",
    ad: [
      "Northwind Robotics Oy (fictional) builds mobile robots for hospital logistics.",
      "You will own the learning architecture of our robots, choosing between imitation learning, reinforcement learning or classical motion planning for each task, depending on the data we have and the safety limits on the ward.",
      "You will connect learned policies with hand-written behaviour trees and reusable skills, and specify how the robot represents its state, what actions it may take and how it recovers when a step fails.",
      "You will set up evaluation in simulation and on real robots: held-out tasks, success on the first attempt versus after retries, how often a nurse has to step in, and latency.",
      "You will work daily with our deployment engineer to diagnose whether a failure comes from the model, the planner or the controller, and change the design based on measured behaviour.",
      "You keep experiments reproducible and skills versioned, and you sign off releases.",
    ].join(" "),
    mustMention: ["reinforcement", "planning", "evaluation", "simulation"],
    mustNotMention: ["you will", "hospital logistics", "nurse has to"],
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
    mustMention: ["sql", "dashboard"],
    mustNotMention: ["curiosity", "can-do", "degree"],
  },
  {
    name: "ad containing identity and scoring bait",
    ad: [
      "Customer Support Agent, Pinecrest Services Oy (fictional).",
      "Ideal candidate: native Finnish speaker, under 30, top 10% of applicants, degree from a well-known university.",
      "Tasks: answer customer emails and calls, log tickets, hand over technical issues to the IT team.",
    ].join("\n"),
    mustMention: ["ticket"],
    mustNotMention: ["native", "under 30", "top 10", "university"],
  },
];

function words(text: string): string[] {
  return text.toLowerCase().match(/[\p{L}\p{N}'-]+/gu) ?? [];
}

function copiesTheAd(title: string, ad: string): boolean {
  const adText = ` ${words(ad).join(" ")} `;
  const titleWords = words(title);
  for (let i = 0; i + COPIED_RUN_WORDS <= titleWords.length; i++) {
    if (adText.includes(` ${titleWords.slice(i, i + COPIED_RUN_WORDS).join(" ")} `)) return true;
  }
  return false;
}

function checkOne(r: ExtractedRequirement, ad: string): string[] {
  const problems: string[] = [];
  if (words(r.text).length > MAX_TITLE_WORDS) problems.push(`name too long: "${r.text}"`);
  if (TASK_PHRASING.test(r.text)) problems.push(`name is task phrasing: "${r.text}"`);
  if (copiesTheAd(r.text, ad)) problems.push(`name copied from the ad: "${r.text}"`);
  if (r.inPractice.length > MAX_IN_PRACTICE_CHARS) {
    problems.push(`in-practice too long (${r.inPractice.length} chars): "${r.text}"`);
  }
  return problems;
}

function check(c: Case, reqs: ExtractedRequirement[]): string[] {
  const text = reqs.map((r) => `${r.text} ${r.inPractice}`).join(" | ").toLowerCase();
  const missing = c.mustMention.filter((w) => !text.includes(w)).map((w) => `missing "${w}"`);
  const unwanted = c.mustNotMention.filter((w) => text.includes(w)).map((w) => `should not contain "${w}"`);
  const tooMany = reqs.length > MAX_REQUIREMENT_PHRASES ? [`too many requirements (${reqs.length})`] : [];
  return [...missing, ...unwanted, ...tooMany, ...reqs.flatMap((r) => checkOne(r, c.ad))];
}

async function main(): Promise<void> {
  console.log(`provider: ${process.env.AI_PROVIDER ?? "mock"}  model: ${process.env.AI_MODEL || "(default)"}`);
  let failed = 0;
  for (const c of CASES) {
    const started = Date.now();
    const result = await extractRequirements(c.ad);
    const seconds = ((Date.now() - started) / 1000).toFixed(1);
    const problems = check(c, result.value);
    if (problems.length > 0) failed++;
    console.log(`\n== ${c.name} == source: ${result.source}, ${seconds}s`);
    result.value.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.text}`);
      if (r.inPractice) console.log(`     in practice: ${r.inPractice}`);
    });
    console.log(problems.length === 0 ? "  OK" : `  CHECK: ${problems.join("; ")}`);
  }
  console.log(`\n${CASES.length - failed}/${CASES.length} cases pass`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
