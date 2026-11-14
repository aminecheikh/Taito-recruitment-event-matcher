# MVP Design — No CV, No Job Ad

Date: 2026-11-14 · Deadline: 2026-11-15 10:00 · Team: 3 people
Concept and product decisions: [../../pipeline.md](../../pipeline.md). Evidence: [../../research/README.md](../../research/README.md). Rules: [../../../AGENTS.md](../../../AGENTS.md).

## Intent

Show Espoo's jury a working, end-to-end prototype of an event pipeline where documents (CVs, job ads) are replaced by a recruiter's ranked top 4 and an applicant's own stories. AI helps people say what they mean — it asks questions, suggests where a story fits, fixes language with a label — but never writes content and never judges people. The demo must make the "human touch" visible: every AI output is a suggestion a person accepts or rejects.

## Goals

- One fictional applicant and one fictional company go through the whole journey live: top 4 → stories → AI-suggested links → signal → anonymous pick → shared card → both decide → information shared.
- The story + AI-link step is deep enough to impress: real model calls, visible reasons, accept/reject/move.
- Switch AI provider (Claude / Gemini / OpenAI / mock) with one env var.
- The demo works with no network (mock provider + local data).

## Non-goals

- Authentication, accounts, email, real scheduling. A role switcher stands in.
- Real persistence or multi-tenant deployment.
- Voice input, mobile app, ESCO integration (pitch only).
- Espoo staff tooling beyond one simple "who needs help" list.

## Anti-goals (fail even if it works)

- Any score, percentage, rank or "best match" about an applicant shown to anyone.
- AI text saved into a story without the applicant explicitly accepting it, or saved without a label.
- Names, photos, age, nationality, education institution shown before a meeting is booked.
- Data that looks like a real person or real company.

## Approaches considered

| Approach | Trade-off | Outcome |
|---|---|---|
| **A. Web app, AI asks questions and suggests links** | Needs an AI provider and prompt guardrails; shows the concept's most novel part working | **Chosen** |
| B. Same app, no AI (fixed question templates) | Simplest and safest, but transferable-skill linking — the core of pain point #5 — would not work | Rejected |
| C. Voice-first practice | Strong fit for "can't say it out loud", but accent bias risk (research 02), sensitive recordings, slow to build | Pitch as future work |

## Stack and architecture

- **Next.js (App Router) + TypeScript + Tailwind**, one app in `app/` at repo root. **Vitest** for logic tests. Package scripts `lint`, `typecheck`, `test` so `scripts/check.sh` picks them up.
- **AI:** Vercel AI SDK (`ai` + `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/openai`) behind `lib/ai/`. Structured outputs validated with **zod**.
- **Storage:** a repository module `lib/store/` over a JSON file in `data/runtime/` (gitignored), seeded from `data/synthetic/`. Server-side only, accessed via server actions / route handlers. Reset button reseeds. *Why:* zero setup, works offline, swappable later. Consequence: run the demo on one Node process (laptop or single host), not serverless.
- **Roles:** a top-bar switcher — Recruiter (company), Applicant, Espoo staff — stored in a cookie. No auth.

```
app/
  (recruiter)/recruiter/…   R1–R4
  (applicant)/applicant/…   A1–A5
  staff/                    S1
  card/[meetingId]/print    printable card (pain point #8)
lib/
  domain/     types.ts (zod schemas), pure logic + tests
  store/      repository over data/runtime/db.json, seed loader
  ai/         provider.ts, functions.ts, prompts/, mock.ts
data/synthetic/  seed JSON (companies, requirements, applicants, stories, event)
```

## AI layer

`lib/ai/provider.ts` returns a model from env:

| Env var | Values |
|---|---|
| `AI_PROVIDER` | `anthropic` \| `google` \| `openai` \| `mock` (default `mock`) |
| `AI_MODEL` | model id for the chosen provider (builder sets current ids in `.env.example`) |
| `ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `OPENAI_API_KEY` | keys, `.env` only |

Four functions in `lib/ai/functions.ts`, each with a zod output schema, a prompt file in `lib/ai/prompts/`, and a mock implementation returning scripted outputs for the seeded demo data:

| Function | Input → Output | Rules baked into the prompt |
|---|---|---|
| `extractRequirements` | job-ad text → `string[]` (≤ 15 short requirement phrases) | Extract only; no invented requirements; plain language |
| `nextFollowUpQuestion` | story draft + previous Q&A → one question | Ask exactly one recall question (situation → own action → result → detail). Never suggest content or wording. Never encourage "confidence". Question bank: research 03 |
| `suggestLinks` | one story + list of requirements (from companies at the event) → up to 3 `{requirementId, reason}` | Reason quotes the story; no scores; no ordering by company popularity; empty list is fine |
| `languageAssist` | text + mode (`grammar` \| `translate`, target language) → text | Keep meaning and facts; change nothing else. Result shown as a diff; saved only on accept, with label |

On any provider error, functions fall back to the mock and the UI shows "AI unavailable — showing example". All AI-facing UI is marked "AI suggestion".

**Ranking pushback is deterministic, not AI:** if a recruiter tries to mark more than 4 as top, the UI blocks it with "Which 4 would you actually hire on?".

## Data model (`lib/domain/types.ts`)

```ts
Company      { id, name /* fictional, ends "(fictional)" */, sector, sizeRange }
Requirement  { id, companyId, text, inPractice: string, rank: number, isTop4: boolean }
Event        { id, name, date, signalsPerApplicant: number /* default 3 */ }
Applicant    { id, pseudonym /* "Applicant 017" */, displayName, contact /* fictional */ }
Story        { id, applicantId, title, body, languageLabel?: "language edited" | `translated from ${string}` }
Link         { id, storyId, requirementId, origin: "ai-suggested" | "applicant", aiReason?: string,
               status: "pending" | "accepted" | "rejected" }
Signal       { eventId, applicantId, companyId }
Meeting      { id, eventId, companyId, applicantId, status: "requested" | "booked" }
Decision     { meetingId, side: "company" | "applicant", continue: boolean,
               feedback?: Record<requirementId, string> /* company side, on no */ }
Share        { meetingId, applicant?: { contact?, cvUrl?, links? }, company?: { contactPerson, nextStep, timeline } }
```

## Pure logic (tested — AGENTS.md says test what would embarrass us)

`lib/domain/`:
- `validateTop4(requirements)` — exactly 4 `isTop4`, unique ranks.
- `spendSignal(state, applicantId, companyId)` — enforces `signalsPerApplicant`, no duplicates; returns new state (immutable).
- `buildCard(company, applicant, stories, links)` — top 4 in rank order, each with accepted linked stories or "no example yet"; **never** includes displayName unless meeting is booked.
- `visibleApplicantName(meeting)` — pseudonym until `booked`.
- `revealDecisions(decisions)` — hidden until both sides submitted; `match = both continue`.
- `readiness(applicant)` — counts for staff list (stories, accepted links). No score, no ordering beyond alphabetical pseudonym.

## Screens

| ID | Role | Screen | Must show |
|---|---|---|---|
| R1 | Recruiter | Set top 4 | Paste ad → AI extract → drag to rank → mark top 4 → "in practice" line each |
| R2 | Recruiter | Who signalled us | Anonymous cards (pseudonym + `buildCard`), "Request meeting" |
| R3 | Recruiter | Meeting card | Shared card; name visible (booked) |
| R4 | Recruiter | Decide | Continue / not; if not, one feedback line per top-4 item; if match, fill contact person / next step / timeline |
| A1 | Applicant | My stories | Write story; "Ask me a question" (AI follow-up); "Fix language" / "Translate" with diff + label |
| A2 | Applicant | Companies | Each company's top 4; per story "Suggest where this fits" → accept / reject / move; gaps per company |
| A3 | Applicant | Signals | Spend N signals; remaining count |
| A4 | Applicant | My meetings | Same shared card as R3 |
| A5 | Applicant | Decide & result | Continue / not; after reveal: match → choose what to share; no match → feedback lines |
| S1 | Staff | Who needs help | Applicants with 0 stories or 0 accepted links, alphabetical; no scores |
| P  | All | Printable card | `card/[meetingId]/print` |

## Synthetic data (skill `synthetic-data`)

Seeded, obviously fictional: 4 companies with 6–10 requirements each, 8 applicants (diverse: career changer, international, non-traditional education, employment gap), 2–3 stories each, 1 event. **Demo pair:** Applicant 017, a bus-depot technician turned job seeker, and "Acme Robotics Oy (fictional)" with top 4: debugging embedded systems, explaining tech to non-technical staff, working with suppliers, Python. Mock AI outputs are scripted for this pair so the demo path works offline.

## Work split (3 people, file ownership avoids conflicts)

| Person | Owns | First deliverable |
|---|---|---|
| **P1 — Foundation + recruiter** | scaffold, `lib/domain/`, `lib/store/`, role switcher, R1–R4, printable card | Scaffold + `types.ts` + store pushed within the first hour — everyone codes against it |
| **P2 — AI + applicant stories** | `lib/ai/` (all providers + mock + prompts), A1, A2 | `lib/ai` with mock working (independent of the app scaffold) |
| **P3 — Data + event flow + pitch** | `data/synthetic/`, A3–A5, S1, decision reveal + share UI, demo script, pitch | Seed JSON matching `types.ts` |

Contract: `lib/domain/types.ts` is the shared contract; changes to it go in their own small commit with a note on the board.

## Milestones

| When | Milestone |
|---|---|
| +1 h | Scaffold, types, store, seed data, `lib/ai` mock — all pushed; `scripts/check.sh` green |
| +6 h | Each screen works on seed data; real provider works for at least one of Claude/Gemini/OpenAI |
| overnight | Full demo path end to end; `responsible-ai-check` on prompts and screens |
| 08:00 | Feature freeze (skill `demo-ready`); rehearse demo path on mock and on a real provider |
| 10:00 | Submit |

## Calls made after builder check (author's calls — team may override)

- **Linking scope:** `suggestLinks` sees requirements of all companies at the event; the applicant sees company names while linking (they choose whom to signal). The applicant's own "gaps per company" view is about their stories, not a score of them.
- **Move a link** = move it to another requirement of the same company.
- **Editing stories:** allowed at any time; accepted links stay (they are the applicant's own claim). The language label stays once applied.
- **Booking:** recruiter requests → applicant accepts → `booked` (name revealed). Both sides opt in.
- **Role switcher:** one presenter can toggle roles; two browser windows also work (shared store, pages read fresh on navigation, a "Refresh" button on R2/A4/A5). Recruiter role has a company picker (default Acme); applicant role has an applicant picker (default Applicant 017).
- **Live demo:** runs on a real provider with automatic mock fallback. Mock outputs are scripted for the demo pair; other seed applicants get generic mock outputs.
- **Hosting:** laptop demo is primary; record a backup video. If a hosted URL is required, use a single Node host with a writable disk (not serverless).
- **No-match feedback:** stored per top-4 requirement and shown to the applicant after reveal.

## Left to the builder

- Current model ids per provider (set in `.env.example`, verify against provider docs).
- AI SDK structured-output API name for the installed version.
- Visual design: plain, readable, accessible; follow the anti-slop rules (no purple gradients, no icon-card grids, no emoji decoration).
- Exact copy on screens, within the rules above.
