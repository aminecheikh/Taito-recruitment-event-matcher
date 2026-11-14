# AGENTS.md

Shared instructions for every AI assistant on this repo (Codex reads this file; Claude Code loads it via `CLAUDE.md`) and for the humans driving them. **Edit only this file**, never add rules to `CLAUDE.md`.

Hackathon repo for the City of Espoo "Rethinking Recruitment" challenge (Junction). Read `docs/challenge-brief.md`, `docs/constraints.md` and `docs/pipeline.md` (our concept) before proposing or building anything.

## First run (every agent, every new clone: do this before anything else)

1. Check setup: `git config core.hooksPath` must print `.githooks`, `git config team.member` must print a name, and `docs/team/<that name>.md` must exist. The session-start briefing shows "⚠ FIRST RUN" when any of these fail.
2. If not set up: ask the human for their short team name (e.g. first name), then run `scripts/setup.sh <name>`. Don't guess the name.
3. Codex: Node 20+ must be installed, and the human runs `/hooks` once to trust `.codex/hooks.json` (until then the guard and briefing don't run, so follow these rules by hand).
4. Then run skill `sync` to claim a task.

## Current phase

Build (MVP). Concept in `docs/pipeline.md`; technical design in `docs/superpowers/specs/2026-11-14-mvp-design.md`. Deadline: tomorrow 10:00. Record ideas in `docs/ideas.md` (skill `log-idea`); record decisions with skill `decide`.

## Product rules (non-negotiable, they are judged)

- **Synthetic data only.** Follow `data/synthetic/README.md`. Never fetch, scrape or generate data about real people.
- **Human decides.** AI may suggest, structure, explain and translate; it must not rank, filter, score or reject individuals on its own. Any match/suggestion needs a visible reason and a way to dismiss or override it.
- **No emotion recognition or biometric inference.** Prohibited under EU AI Act Art. 5.
- **Data minimisation.** Every personal-data field needs a stated purpose. Prefer skills/needs over identity attributes. Never use nationality, language of origin, age, gender, name, photo or education institution as matching features.
- **Symmetry.** If talent gets help describing themselves, companies get help describing their needs too (pain point #2).
- **Event-start load spike.** Anything live during an event must tolerate everyone joining at once: precompute, cache, degrade gracefully.
- Label AI-generated or AI-edited content and tell users when they talk to an AI.

Run skill `responsible-ai-check` before shipping anything that touches matching, prompts, personal-data fields or the pitch.

## How we work: hackathon pace

Speed comes from never blocking each other, not from skipping checks. This repo deliberately overrides slower habits (PR reviews, TDD-first, coverage gates): **trunk-based, small pushes, main always runs.**

1. **Start:** skill `sync`: `git pull --rebase`, read the team board (printed automatically at session start, or `node .agents/hooks/session-start.mjs`), claim your task in `docs/team/<you>.md` and push the claim.
2. **Build** in small slices. Stay inside the files your claim names; if you need to change a teammate's area, keep it minimal and mention it in your commit message.
3. **Ship** every working slice (at least every 30–60 min) with skill `ship`: `scripts/check.sh` → conventional commit → `git pull --rebase` → `git push` to `main`.
4. **Never leave main broken.** If you break it, fixing it beats everything else. If someone else broke it, tell the human who (from `git log`) rather than rewriting their work.
5. **Don't rewrite fresh work.** Before a big edit, check `git log --stat -5 -- <path>`. Code a teammate committed in the last hour is not yours to restructure without asking.
6. **Ask the human, don't guess,** on product questions; keep going on purely technical ones.
7. **Several agents in one checkout:** stage named files only (`git add path/…`), never `git add -A`. For parallel or risky work use a worktree: `git worktree add .claude/worktrees/<task> -b feat/<task>` and merge it the same day.

UI: use the classes in `app/globals.css` (`page`, `h1`/`h2`, `card`, `panel`, `btn`/`btn-primary`/`btn-sm`, `field`, `req-no`, `tag-ai`, `notice-error`…) and semantic colours (`text-muted`, `border-line`, `bg-surface`), never raw `neutral-*`/`red-*`, or dark mode breaks. Anything AI-generated gets `tag tag-ai` or `ai-panel`.

Tests: write them for logic whose failure would embarrass us in the demo (matching/suggestion logic, data transforms, anything computing a number shown to users). UI and glue code don't need tests. No coverage gate.

## Git

- Conventional commits: `feat(scope): …`, `fix:`, `docs:`, `data:`, `chore:`, `refactor:`, `test:` (enforced by `.githooks/commit-msg`).
- Push to `main` directly. Short-lived `feat/<thing>` branches only for risky spikes.
- Blocked by the agent guard (`.agents/hooks/guard.mjs`): force-push to main, deleting main, `--no-verify`, `git add -f`, and commands that throw away uncommitted work (`reset --hard`, `clean -f`, `checkout -- .`, `restore .`, `stash drop/clear`). If one is really needed, the human runs it.
- Git hooks (`.githooks/`, enabled by `scripts/setup.sh`): pre-commit blocks secret files, API keys, files over 5 MB and non-reserved email domains in `data/`; pre-push runs `scripts/check.sh`.

## Secrets

API keys live in `.env` (gitignored); commit names only, in `.env.example`. Agents never read or print `.env` and refer to variables by name. The repo will be public at judging.

## Commands

| What | Command |
|---|---|
| One-time setup per clone (see First run) | `scripts/setup.sh <your-name>` |
| Gate before push (also pre-push) | `scripts/check.sh` |
| Team board + sync status | `node .agents/hooks/session-start.mjs` |
| Install dependencies | `npm install` |
| Dev server (in a tmux session) | `npm run dev` |
| Tests | `npm test` |
| Lint | `npm run lint` |
| Type check | `npm run typecheck` |

`scripts/check.sh` picks up the `lint`, `typecheck` and `test` scripts in `package.json`.

## Skills

Shared by both tools in `.agents/skills/` (`.claude/skills` is a symlink to it). Humans invoke them as `/name` in Claude Code or `$name` in Codex.

**Agents: use these on your own.** Humans will forget to ask. When a trigger below fits, run the skill yourself without waiting to be told, and say in one line which one you ran ("Ran `ship`: pushed abc123"). If two fit, run them in order (e.g. `responsible-ai-check` before `ship`).

| Skill | Run it on your own when… |
|---|---|
| `sync` | A session starts, you switch task, or the briefing says you're behind origin |
| `ship` | A slice works and `scripts/check.sh` is green, or 30–60 min of work is unpushed. Report what you pushed |
| `responsible-ai-check` | A change touches matching, AI prompts, personal-data fields, what recruiters/applicants see, or the pitch |
| `synthetic-data` | Code needs seed data, personas or fixtures, or data files under `data/` change |
| `log-idea` | Someone floats a new idea or variant ("what if we…") |
| `decide` | The human states a decision, cuts scope, picks a tool or schema, or relays a mentor answer |
| `demo-ready` | Within ~4 h of the deadline, or anyone mentions the demo, pitch, freeze or submission |

## Repo map

```
AGENTS.md          this file: the single source of agent instructions
CLAUDE.md          imports AGENTS.md (no content of its own)
.agents/hooks/     guard.mjs (PreToolUse) + session-start.mjs, shared by Claude and Codex, with tests
.agents/skills/    shared skills
.claude/           settings.json (permissions + hooks); skills -> ../.agents/skills
.codex/hooks.json  the same hooks for Codex
.githooks/         git hooks for everyone (humans included)
scripts/           setup.sh, check.sh
docs/              brief, constraints, pipeline (concept), ideas, research, team boards
data/synthetic/    fictional data only
```

## Keeping this file current

When something you learn would change how the next agent works (a decision, a gotcha, a new command), update this file in the same commit. Keep it short: rules and pointers, not essays.

## Decisions log

| Date | Decision | Why |
|---|---|---|
| 2026-11-14 | `AGENTS.md` is the single instruction file; skills and hooks shared in `.agents/` | One teammate uses Codex, the rest Claude Code; one source avoids drift |
| 2026-11-14 | Trunk-based on `main`, small pushes, `scripts/check.sh` as the only gate, per-person team boards | Hackathon pace: no PR queues, no waiting on reviews, no board merge conflicts |
| 2026-11-14 | Stack: Next.js + TypeScript (one app, UI + API routes), Tailwind, Vitest | One thing to run, easy to split by page across 3 people |
| 2026-11-14 | AI is provider-agnostic: Claude, Gemini or OpenAI chosen by env var, plus a scripted `mock` provider | Team has keys for all three; mock keeps the demo working offline and makes AI logic testable |
| 2026-11-14 | MVP scope: thin full journey on synthetic data, depth on the story + AI-link step | Judges see the whole concept; the AI-link step is the most novel part |
| 2026-11-14 | UI design system: tokens + component classes in `app/globals.css` (paper canvas, spruce accent, ochre reserved for AI), Source Serif 4 + Public Sans, `PageHeader` component; light + dark | Calm Nordic public-service look from `docs/design/stitch-brief.md`; one AI marker everywhere makes AI content recognisable |
| 2026-11-14 | UI polish: one `.shell` width so every left edge lines up (plain pages = left-aligned reading column); demo controls in a dark prototype strip; `.req-no` marker wherever a requirement appears (filled = core); cool stone canvas, smaller radii, `btn-sm`/`btn-icon`/`btn-danger` | Pages jumped width between tabs, demo bar looked like product UI and overflowed on mobile, requirement numbering differed per page |
| 2026-11-14 | Visual refresh v2: palette "stone and blueprint" (stone `#dfdedb` ground, white surfaces, ink `#26251e`, blue `#2456d6` actions, ochre still only for AI), Newsreader 400 headings + Hanken Grotesk text; motion layer in `globals.css` (button step/press, link underline draw, `.card-link` 2px lift, one `[data-enter]` hero entrance, reduced motion rests); home hero shows a real evidence slot from the store | Asked for something more elegant and professional; palette and type dealt by the design-taste skill for a people-hiring service, not copied from espoo.fi |
| 2026-11-14 | Themes: Light (stone), Bright (creamy white `#fbf8f1`), Dark via `<html data-theme>` from the `theme` cookie (`lib/theme.ts`, switch in the header); no cookie follows the system. Motion follows Emil Kowalski's rules (`--ease-out`/`--ease-in-out` tokens, transform/opacity only, under 300ms, reduced motion = fades only): press feedback, `@starting-style` entrances for AI panels/notices, view-transition reorder of requirements, `.moment-match` on a match | Asked for a bright cream mode and more motion; motion limited to feedback, state and rare moments so daily screens stay fast |
| 2026-11-14 | Apple-design pass: sticky translucent header (`.material` + `.scroll-edge`, no divider at rest), floating `.material-float` save bar, `--depth-1`/`--depth-3` shadows, segmented controls with a sliding `.seg-thumb` (set `--n`/`--i`), size-specific tracking, 100ms press; solid materials under reduced transparency or more contrast | Asked to apply Emil Kowalski's `apple-design` skill; gesture/spring parts skipped as the app has no drag interactions |
| 2026-11-14 | Two themes only: Light (cream `#fbf8f1`, the default ground) and Dark; the stone palette is gone and "Bright" was renamed Light. No cookie follows the system | Two near-identical light options were confusing in the switch |
| 2026-11-14 | Events: 3 seeded fictional events with date, start/end time and location; event picker for every role in the prototype strip; each event's window split into 30-minute slots is everyone's calendar; a side is at its maximum when its slots for that event are booked; the applicant picks a slot free for both when accepting (`lib/domain/calendar.ts`, `eventFormat.ts`, `EventCalendar`) | Asked for event selection across roles and a calendar with bookable 30-minute slots; events happen on different days |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
