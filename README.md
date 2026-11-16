# Taito: recruitment without CVs or job ads

*Taito* is Finnish for "ability". It is a working prototype for the City of Espoo **"Rethinking Recruitment"** challenge at Junction, built as a layer on Espoo's TalentMatch recruitment events.

> **All data in this repo is synthetic.** Every company, applicant, event and CV is fictional (see [data/synthetic/README.md](data/synthetic/README.md)).

## The idea

Both sides of hiring now use AI: applicants send AI-written CVs and AI screeners read them, so matching ends up comparing generated text with generated text. Job ads list wishes rather than real needs, and applicants struggle to describe transferable skills.

Taito drops both documents:

- **Recruiters** commit to **1–5 ranked core requirements**, each with one line on what it looks like in practice.
- **Applicants** give **one real example per requirement**, in their own words.
- **Names stay hidden** until a meeting is booked.
- **AI asks and suggests; people decide.** The AI never scores, ranks, filters or rejects anyone on its own.

The full concept is in [docs/pipeline.md](docs/pipeline.md) and a longer write-up in [docs/project-description.md](docs/project-description.md).

## What's in the prototype

| Role | What they can do |
|---|---|
| **Recruiter** | Paste an old job ad and get AI-suggested requirements to keep, edit or delete (labelled as AI). A sixth core requirement is refused. Review anonymous applicants who signalled the company, score each requirement 0–10 (weighted by the recruiter's own ranking), narrow the list with optional AI search that always shows its reason and how many it hides, invite in bulk. |
| **Applicant** | Write stories from work, volunteering, studies or caregiving. Get story ideas from a pasted CV or a PDF read in the browser (never saved). The AI asks recall questions but never writes content. Fill each company's requirement cards, optionally starting from a story the AI recommends with a visible reason. Send up to 3 signals per event. |
| **Both** | Book a 30-minute meeting slot free on both sides, then each answers *continue or not* independently; a match needs both. "Not this time" comes with human feedback per requirement. A printable meeting card works without AI or network. |
| **Event staff** | See who is stuck, send reminders, offer coaching. Insights are aggregate only (groups under 5 are hidden) and staff never see scores. |
| **Everyone** | A privacy page lists every stored field with its purpose, plus *Download my data* and *Delete all my data*. |

Switch role, company, applicant and event from the dark **prototype strip** at the top of every page.

## Responsible AI by design

- **The AI never judges people.** An input guard refuses judging requests right where you type ("Rank the applicants" in the job-ad box gets a no).
- **Every decision is human.** Every AI suggestion has a reason and can be dismissed.
- **Data minimisation.** Name, photo, age, gender, nationality and school are never matching features. Prompts see aliases, never names or scores.
- **No emotion recognition or biometric inference** (EU AI Act Art. 5). AI content is always labelled (Art. 50).
- **Symmetry.** Applicants and companies both get help describing themselves.
- **Moving help is opt-in** and reaches the company only after both sides decide to continue, so it can't sway the decision.
- **Event-start load.** No AI calls are needed at event time. If a provider fails or times out, the app shows a labelled example instead.

The hard rules are in [docs/constraints.md](docs/constraints.md).

## Quick start

Requires **Node 20+** (the hosted copy runs Node 22).

```sh
npm install
cp .env.example .env     # defaults to AI_PROVIDER=mock: no key needed, works offline
npm run dev              # http://localhost:3000
```

Use **Reset demo data** in the prototype strip to return to the seed.

### Using a real AI provider

Set these names in `.env` (never commit values; `.env` is gitignored):

| Variable | Purpose |
|---|---|
| `AI_PROVIDER` | `mock` (default), `google`, `anthropic` or `openai` |
| `AI_MODEL` | Model id for the chosen provider |
| `GOOGLE_GENERATIVE_AI_API_KEY` / `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` | Key for the provider you picked |

Optional tuning (rate limits, timeouts, store path, `DEMO_RESET_ENABLED`) is documented in [.env.example](.env.example). Check a provider works with `npm run ai:smoke`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Vitest suites (domain logic, AI guardrails, seed data) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm run ai:smoke` | One real call to the configured AI provider |
| `npm run ai:eval-extract` | Evaluate requirement extraction from job ads |
| `scripts/check.sh` | The gate before every push: hook tests, lint, typecheck, tests |

## How it's built

- **Stack:** Next.js 16 (App Router, UI and API routes in one app), React 19, TypeScript, Tailwind 4, Vitest.
- **Data:** a local JSON store (`data/runtime/db.json`, gitignored) seeded from `data/synthetic/`. One Node process; no database to run.
- **AI:** provider-agnostic through the Vercel AI SDK (Gemini, Claude or OpenAI) plus a scripted `mock` provider for offline use and tests. Input caps, per-visitor and global rate limits, a suggestion cache and guardrails sit in front of every call.
- **Logic:** pure, tested modules in `lib/domain/` (cards, scores, calendar, meetings, decisions, privacy, insights…).
- **Design:** the "Moi" look, Finnish blue and white on cream paper with two original mascots, in light and dark themes. Mint marks AI content and nothing else. Tokens and component classes live in `app/globals.css`.
- **Hosting:** Render free tier from [render.yaml](render.yaml), auto-deployed on push to `main`. The free instance sleeps after 15 minutes idle (first visit takes about a minute) and data returns to the seed on each sleep or deploy.

## Repo layout

```
app/
  (applicant)/applicant/   stories, entries, companies, signals, meetings
  (recruiter)/recruiter/   requirements, applicants, meetings
  staff/                   event staff view and aggregate insights
  card/[meetingId]/        printable meeting card
  privacy/                 field purposes, export, delete
  api/ai/                  AI routes (extract requirements, follow-up questions, suggestions, search…)
  api/me/export/           download my data
lib/
  domain/                  pure business logic + tests
  ai/                      provider, prompts, guardrails, rate limits, cache, mock
  store/                   JSON store and seeding
data/synthetic/            fictional companies, talent, events + generator
docs/                      brief, constraints, concept, specs, demo script, research, team boards
scripts/                   setup.sh, check.sh, AI smoke and eval scripts
.agents/                   shared hooks and skills for Claude Code and Codex
.githooks/                 git hooks for everyone
```

## Docs

| Doc | What's in it |
|---|---|
| [docs/challenge-brief.md](docs/challenge-brief.md) | The challenge, its 9 pain points, judging criteria |
| [docs/constraints.md](docs/constraints.md) | Hard rules: synthetic data, human decides, EU AI Act and GDPR context |
| [docs/pipeline.md](docs/pipeline.md) | Our concept end to end |
| [docs/superpowers/specs/2026-11-14-mvp-design.md](docs/superpowers/specs/2026-11-14-mvp-design.md) | Technical design of the MVP |
| [docs/demo/demo-script.md](docs/demo/demo-script.md) | Click-by-click demo path |
| [docs/research/](docs/research/README.md) | Research reports and synthesis |
| [docs/ideas.md](docs/ideas.md) | Idea log |

## Contributing (team workflow)

```sh
scripts/setup.sh <your-name>   # once per clone: git hooks, rebase-on-pull, your team board
```

- Agent and team rules live in [AGENTS.md](AGENTS.md), shared by Claude Code and Codex (`CLAUDE.md` only imports it).
- Trunk-based on `main`: claim a task in `docs/team/<you>.md`, ship small slices, keep `main` running. `scripts/check.sh` is the only gate and also runs on `git push`.
- Conventional commits (`feat(scope): …`, `fix:`, `docs:`, `data:` …), enforced by `.githooks/commit-msg`.
- Shared skills in `.agents/skills/`: `sync`, `ship`, `responsible-ai-check`, `synthetic-data`, `log-idea`, `decide`, `demo-ready`.

## Next steps

Pilot with Business Espoo on TalentMatch and measure the clarity of examples and the rate of second conversations. Add a scoring guide, ESCO skill mapping, voice input and more languages, and complete the EU AI Act and GDPR work (DPIA, FRIA, logging, human oversight).
