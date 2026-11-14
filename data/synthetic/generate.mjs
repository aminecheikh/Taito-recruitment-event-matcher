// Synthetic seed generator. Run: node data/synthetic/generate.mjs
// Rewrites companies/companies.json, talent/talent.json, events/events.json deterministically.
// Everything here is fictional: no real people, no real companies, emails only on example.org.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SEED = 20261114;
const SIGNALS_PER_APPLICANT = 3;
const MEETING_SLOTS = 10;
const EVENT_ID = "event-01";

// Small seeded PRNG (mulberry32).
function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = makeRng(SEED);
const pick = (items) => items[Math.floor(rng() * items.length)];
const pad = (n, width = 2) => String(n).padStart(width, "0");

// ---------- companies and requirements ----------
// Each requirement: [text, inPractice]. The first `core` entries are core, ranked 1..core.
const COMPANY_DEFS = [
  {
    name: "Acme Robotics Oy (fictional)", sector: "Robotics", sizeRange: "51-200", core: 4,
    reqs: [
      ["Debugging embedded systems", "You have found why a device misbehaved when the cause was not obvious, and fixed it."],
      ["Explaining technology to non-technical staff", "You have made a technical problem clear to people who do not work with it."],
      ["Working with suppliers", "You have chased, negotiated with or relied on an outside supplier to get something resolved."],
      ["Python", "You have written Python to automate or analyse something real, however small."],
      ["Reading electrical schematics", "You can follow a circuit diagram to locate a fault."],
      ["Writing test plans", "You have written down how to check that something works before shipping it."],
      ["Working in English", "You can work through technical discussions in English."],
      ["Learning unfamiliar hardware quickly", "You have picked up a device you had never seen and made it work."],
    ],
  },
  {
    name: "Kestrel Logistics Ab (fictional)", sector: "Logistics", sizeRange: "201-500", core: 5,
    reqs: [
      ["Planning routes under changing constraints", "You have replanned a day's work when something broke or someone was missing."],
      ["Calm handling of customer complaints", "You have turned an angry customer into a settled one."],
      ["Warehouse management systems", "You have used a stock or warehouse system day to day."],
      ["Coordinating shift teams", "You have kept a group of people on task across a shift."],
      ["Spreadsheet analysis", "You have used a spreadsheet to find a pattern and acted on it."],
      ["Forklift licence", "You hold or have held a forklift licence."],
      ["Fluent Swedish", "You can handle customers in Swedish."],
      ["Fluent English", "You can handle customers in English."],
      ["Customs documentation", "You have filled in or checked cross-border shipping paperwork."],
      ["Dangerous goods rules", "You have handled goods that need special labelling or storage."],
    ],
  },
  {
    name: "Birchline Care Services (fictional)", sector: "Health and social care", sizeRange: "51-200", core: 3,
    reqs: [
      ["Staying calm with distressed people", "You have stayed steady while someone close to you or in your care was upset."],
      ["Writing clear care notes", "You have recorded what happened so that the next person could act on it."],
      ["Coordinating with families", "You have kept relatives informed and agreed on who does what."],
      ["First aid", "You have first aid training or have used it."],
      ["Flexible shifts", "You can work evenings and weekends on a rota."],
      ["Finnish at B1 level", "You can follow and give simple instructions in Finnish."],
      ["Driving licence", "You hold a valid driving licence."],
    ],
  },
  {
    name: "Tidewater Energy Oy (fictional)", sector: "Energy", sizeRange: "201-500", core: 5,
    reqs: [
      ["Diagnosing faults in electrical equipment", "You have found the cause of a power or equipment fault methodically."],
      ["Safety-first decision making", "You have stopped or delayed work because it was not safe."],
      ["Reading technical drawings", "You can read single-line diagrams or equipment drawings."],
      ["Writing incident reports", "You have written up an incident so others could learn from it."],
      ["Working with contractors", "You have directed or coordinated outside crews."],
      ["SCADA familiarity", "You have watched or operated a plant monitoring screen."],
      ["Data analysis in Python", "You have used Python to look at measurements or logs."],
      ["Working in English", "You can work through technical discussions in English."],
      ["Mentoring apprentices", "You have shown a newcomer how to do a task properly."],
    ],
  },
];

function buildCompanies() {
  const companies = [];
  const requirements = [];
  COMPANY_DEFS.forEach((def, i) => {
    const cn = pad(i + 1);
    companies.push({ id: `company-${cn}`, name: def.name, sector: def.sector, sizeRange: def.sizeRange });
    def.reqs.forEach(([text, inPractice], j) => {
      requirements.push({
        id: `req-${cn}-${j + 1}`, companyId: `company-${cn}`, text, inPractice,
        rank: j + 1, isCore: j < def.core,
      });
    });
  });
  return { companies, requirements };
}

// ---------- applicants and stories ----------
const APPLICANT_DEFS = [
  { n: 3, name: "Amara Teststone (fictional)", note: "career changer, volunteering example" },
  { n: 5, name: "Dmitri Quillfeather (fictional)", note: "international, foreign credentials" },
  { n: 9, name: "Noor Fennwick (fictional)", note: "non-traditional education, self-taught" },
  { n: 11, name: "Sigrid Alderbrook (fictional)", note: "caregiving gap" },
  { n: 14, name: "Tomasz Greywillow (fictional)", note: "family business" },
  { n: 17, name: "Lakshmi Hartwell (fictional)", note: "demo applicant, bus depot IT support" },
  { n: 21, name: "Yusuf Marrowby (fictional)", note: "international student, story translated" },
  { n: 26, name: "Ilkka Dunmoor (fictional)", note: "former conscript technician turned career changer" },
];

// stories keyed by applicant number: [title, body, languageLabel?, requirement ids it is linked to]
const STORY_DEFS = {
  3: [
    ["Inventory sheet for the food bank", "I volunteer at a neighbourhood food bank on Saturdays. Stock was tracked on paper and we kept running out of tinned goods. I wrote a short Python script that reads the weekly donations spreadsheet and prints what to ask for. We stopped running out within a month.", null, ["req-01-4"]],
    ["Explaining the new rota to eleven volunteers", "After ten years as a nurse I was the only one at the food bank who could explain things calmly to people who were anxious about computers. I ran two short sessions on the new sign-up tool and wrote a one-page guide with screenshots. Nobody dropped out over it.", null, ["req-01-2"]],
    ["Getting the wholesaler to deliver on time", "Our wholesaler delivered late three weeks in a row. I phoned their dispatcher, learned their cut-off time, and moved our order to fit it. Deliveries have been on time since.", null, ["req-01-3"]],
  ],
  5: [
    ["Smart meter that reset itself", "At an electronics plant abroad I handled returns of smart meters that rebooted at random. I traced the resets to a brownout on one supply rail, wrote a Python script to scan the test logs for the same signature across 4,000 units, and the design team changed the capacitor.", null, ["req-01-1", "req-01-4"]],
    ["Teaching the line operators a new dashboard", "When we replaced paper test sheets with a dashboard, the operators distrusted it. I sat on the line for a week, explained each number in plain words, and let them correct me. Adoption went from half the shifts to all of them.", null, ["req-01-2"]],
    ["Sensor batch that failed incoming checks", "A sensor supplier shipped a batch outside tolerance. I documented the failures with measurements, called their quality contact, and agreed a replacement batch plus a tighter incoming check. The line was stopped for one day instead of two weeks.", null, ["req-01-3"]],
  ],
  9: [
    ["Ordering script for my uncle's restaurant", "I never finished school but I taught myself Python from library books. I wrote a script that turns the kitchen's daily sales into a supplier order list. The restaurant now wastes less fresh produce.", null, ["req-01-4"]],
    ["Showing the cook how the till reports work", "The cook did not trust the till reports. I walked through one day's numbers on a napkin, explained where each figure came from, and showed which ones to ignore. He now reads the report himself every morning.", null, ["req-01-2"]],
  ],
  11: [
    ["Running my father's care for two years", "I left work to care for my father after his stroke. I coordinated three siblings, a home nurse and the municipality, kept everyone informed with a weekly message, and stayed steady through hard nights.", null, ["req-03-1", "req-03-3"]],
    ["The care diary", "I kept a daily diary of medication, meals and mood so that any relative or nurse could take over without a phone call. The home nurse started using the same format for her own visits.", null, ["req-03-2"]],
  ],
  14: [
    ["Radios that came back with the same fault", "My family runs a small electronics repair shop. A batch of handheld radios kept coming back with weak audio. I compared the failures, found they all had a cracked solder joint near the jack, and changed how we reflow it. The repeat returns stopped.", null, ["req-01-1"]],
    ["Disagreement with a parts wholesaler", "A wholesaler sent us the wrong connectors twice and refused a refund. I gathered the order emails and photos and wrote to their manager. They credited the order.", null, ["req-01-3:rejected"]],
  ],
  17: [
    ["Ticket readers that froze after an update", "At a bus depot (fictional) I do IT support for the drivers. After an overnight update the ticket readers froze on about one bus in five, mostly in the cold early morning. I kept a log of every freeze, traced a fault to a firmware timing issue between the reader and the payment module, and got the supplier to fix it. The patched firmware went out the next week.", null, []],
    ["Teaching drivers the new handheld", "When the depot got new handheld terminals, drivers were afraid of breaking them. I made a laminated card with four steps and ran short sessions between shifts. Support calls about the terminals dropped within two weeks.", null, []],
    ["Shift swap sheet", "Shift swaps were agreed by phone and often lost. I built a shared sheet with a few formulas so that a swap shows as covered or not at a glance. The dispatcher uses it daily.", null, []],
  ],
  21: [
    ["Power cut in the district", "I was a student when the power failed across my district for two days. I volunteered with the local engineers, helped find that a transformer fuse had tripped because of an overloaded feeder, and held the safety line while the crew worked.", "translated from Arabic", ["req-04-1", "req-04-2"]],
    ["Coordinating the repair crews", "I carried messages between the municipal crew and a private contractor who did not share a language. I wrote the steps in both languages so nobody had to guess, and the work finished a day early.", "translated from Arabic", ["req-04-5"]],
  ],
  26: [
    ["Field radios that lost range", "During my service I was the technician for a unit's field radios. I found that a batch lost range because of corroded antenna connectors, replaced them, and wrote a short checklist so the next crew would check them first.", "language edited", ["req-01-1"]],
    ["Briefing recruits on the new equipment", "I explained the new radio kit to new recruits who had never used one, using plain words and a live demonstration. Every recruit passed the practical test on the first try.", "language edited", ["req-01-2"]],
    ["Spare parts from the central depot", "Spare parts from the central depot were slow. I phoned their planner, learned their ordering cycle and moved our requests to fit it. Wait time fell from three weeks to one.", "language edited", ["req-01-3"]],
  ],
};

const AI_REASONS = [
  "The story describes finding a hidden cause and fixing it.",
  "The applicant explains the work in plain words to the people affected.",
  "The applicant dealt directly with an outside party to get a result.",
  "The story shows the skill used on a real task with a visible outcome.",
];

// Applicants who signalled interest: applicantNumber -> company ids. talent-017 deliberately has none.
const SIGNAL_DEFS = {
  3: ["company-01"], 5: ["company-01"], 9: ["company-01"], 14: ["company-01"], 26: ["company-01"],
  11: ["company-03"], 21: ["company-04"],
};

function buildTalent() {
  const applicants = [];
  const stories = [];
  const links = [];
  const signals = [];
  for (const def of APPLICANT_DEFS) {
    const tn = pad(def.n, 3);
    applicants.push({
      id: `talent-${tn}`, pseudonym: `Applicant ${tn}`, displayName: def.name,
      contact: { email: `talent-${tn}@example.org` },
    });
    STORY_DEFS[def.n].forEach(([title, body, languageLabel, reqRefs], i) => {
      const storyId = `story-${tn}-${i + 1}`;
      stories.push({
        id: storyId, applicantId: `talent-${tn}`, title, body,
        ...(languageLabel ? { languageLabel } : {}),
      });
      for (const ref of reqRefs) {
        const [requirementId, forced] = ref.split(":");
        const status = forced ?? "accepted";
        const aiSuggested = rng() < 0.5;
        links.push({
          id: `link-${pad(links.length + 1, 3)}`, storyId, requirementId,
          origin: aiSuggested ? "ai-suggested" : "applicant",
          ...(aiSuggested ? { aiReason: pick(AI_REASONS) } : {}),
          status,
        });
      }
    });
    for (const companyId of SIGNAL_DEFS[def.n] ?? []) {
      signals.push({ eventId: EVENT_ID, applicantId: `talent-${tn}`, companyId });
    }
  }
  return { applicants, stories, links, signals };
}

function buildEvents(companies) {
  return {
    events: [{ id: EVENT_ID, name: "Spring Meetup Helsinki (fictional)", date: "2026-12-05", signalsPerApplicant: SIGNALS_PER_APPLICANT }],
    companyEvents: companies.map((c) => ({ companyId: c.id, eventId: EVENT_ID, meetingSlots: MEETING_SLOTS })),
  };
}

function write(root, rel, data) {
  const file = join(root, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

const root = dirname(fileURLToPath(import.meta.url));
const companyData = buildCompanies();
write(root, "companies/companies.json", companyData);
write(root, "talent/talent.json", buildTalent());
write(root, "events/events.json", buildEvents(companyData.companies));
