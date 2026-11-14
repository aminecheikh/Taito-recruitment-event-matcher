# AGENTS.md

Shared instructions for every AI assistant on this repo (Codex reads this file; Claude Code loads it via `CLAUDE.md`) and for the humans driving them. **Edit only this file**, never add rules to `CLAUDE.md`.

Hackathon repo for the City of Espoo "Rethinking Recruitment" challenge (Junction). Read `docs/challenge-brief.md`, `docs/constraints.md` and `docs/pipeline.md` (our concept) before proposing or building anything.

## First run (every agent, every new clone: do this before anything else)

1. Check setup: `git config core.hooksPath` must print `.githooks`, `git config team.member` must print a name, and `docs/team/<that name>.md` must exist. The session-start briefing shows "⚠ FIRST RUN" when any of these fail.
2. If not set up: ask the human for their short team name (e.g. first name), then run `scripts/setup.sh <name>`. Don't guess the name.
3. Codex: Node 20+ must be installed, and the human runs `/hooks` once to trust `.codex/hooks.json` (until then the guard and briefing don't run, so follow these rules by hand).
4. Then run skill `sync` to claim a task.

## Current phase

Ideation → concept in `docs/pipeline.md`. No stack chosen, no app code. Record ideas in `docs/ideas.md` (skill `log-idea`); record decisions with skill `decide`.

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

When a stack is chosen, add its install / dev / test commands here and make sure `scripts/check.sh` picks them up (`package.json` scripts named `lint`, `typecheck`, `test`; `pyproject.toml` with ruff/pytest).

## Skills

Shared by both tools in `.agents/skills/` (`.claude/skills` is a symlink to it). Invoke as `/name` in Claude Code, `$name` in Codex, or just describe the task.

| Skill | Use for |
|---|---|
| `sync` | Start of session: pull, read the board, claim a task |
| `ship` | Check → commit → rebase → push, including conflict handling |
| `responsible-ai-check` | Check a feature, prompt or diff against the product rules |
| `synthetic-data` | Seeded, obviously fictional demo data and personas |
| `log-idea` | Add and score an idea in `docs/ideas.md` |
| `decide` | Record a decision so every agent picks it up |
| `demo-ready` | Freeze, demo path, judging coverage, submission |

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
