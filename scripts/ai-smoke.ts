// Real-provider smoke test: runs all four AI functions on the demo pair and prints provider, source and output.
// Usage: AI_PROVIDER=google|anthropic|openai|mock npm run ai:smoke   (keys are read from .env if present)
import {
  extractRequirements,
  languageAssist,
  nextFollowUpQuestion,
  suggestLinks,
} from "@/lib/ai/functions";
import { DEFAULT_PROVIDER, getModel } from "@/lib/ai/provider";

const KEY_BY_PROVIDER: Record<string, string> = {
  google: "GOOGLE_GENERATIVE_AI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  openai: "OPENAI_API_KEY",
};

const DEMO_STORY = {
  id: "demo-story",
  body: "I was the ticket reader on the line. I traced a fault to a loose cable and got the supplier to fix it.",
};
const ACME_REQUIREMENTS = [
  { id: "req-01-1", companyId: "acme", text: "Debugging embedded systems", inPractice: "Finding the cause of a fault in a device." },
  { id: "req-01-2", companyId: "acme", text: "Explaining tech to non-technical staff", inPractice: "Making a technical point clear to colleagues outside engineering." },
  { id: "req-01-3", companyId: "acme", text: "Working with suppliers", inPractice: "Getting a supplier to act on a problem." },
  { id: "req-01-4", companyId: "acme", text: "Python", inPractice: "Writing small scripts and tools." },
];
const DEMO_JOB_AD = [
  "- Debugging embedded systems",
  "- Explaining tech to non-technical staff",
  "- Working with suppliers",
  "- Python",
].join("\n");

function describeProvider(): string {
  const provider = process.env.AI_PROVIDER ?? DEFAULT_PROVIDER;
  if (provider === DEFAULT_PROVIDER) return "mock (no model calls)";
  const keyName = KEY_BY_PROVIDER[provider];
  if (!keyName) return `${provider} (unknown provider, the mock will be used)`;
  return process.env[keyName]
    ? provider
    : `${provider} (NOTE: ${keyName} is not set, add it to .env; the mock will be used)`;
}

function show(name: string, result: { source: string; value: unknown }): void {
  console.log(`\n== ${name} ==\nsource: ${result.source}\n${JSON.stringify(result.value, null, 2)}`);
}

async function main(): Promise<void> {
  console.log(`provider: ${describeProvider()}`);
  console.log(`model configured: ${getModel() ? "yes" : "no"}`);
  show("extractRequirements", await extractRequirements(DEMO_JOB_AD));
  show(
    "nextFollowUpQuestion",
    await nextFollowUpQuestion({ storyBody: DEMO_STORY.body, history: [] }),
  );
  show("suggestLinks", await suggestLinks({ story: DEMO_STORY, requirements: ACME_REQUIREMENTS }));
  show(
    "languageAssist (grammar)",
    await languageAssist({ text: "I tracd a fault to a loose cable.", mode: "grammar" }),
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
