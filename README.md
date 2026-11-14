# Rethinking Recruitment — City of Espoo × Junction

Hackathon project for the City of Espoo challenge: help companies and talent find relevant connections at Espoo's recruitment and matchmaking events, now that AI-generated CVs and AI-assisted screening are common.

**Status:** concept in progress — see [docs/pipeline.md](docs/pipeline.md). No stack chosen.

## Start here

| Doc | What's in it |
|-----|--------------|
| [docs/pipeline.md](docs/pipeline.md) | **Our concept** — end-to-end pipeline, decisions so far, open problems |
| [docs/research/](docs/research/README.md) | Research knowledge base: 6 reports + synthesis |
| [docs/challenge-brief.md](docs/challenge-brief.md) | The challenge, the 9 known pain points mapped to users and journey stage, judging, prizes |
| [docs/constraints.md](docs/constraints.md) | Hard rules: synthetic data, human decides, EU AI Act & GDPR context, design patterns that keep risk low |
| [docs/ideas.md](docs/ideas.md) | Idea log with a scoring rubric derived from the judging criteria |
| [docs/resources.md](docs/resources.md) | ESCO, job boards, event platforms, public-sector APIs |
| [data/synthetic/](data/synthetic/README.md) | Rules for synthetic data |

## The three non-negotiables

1. Synthetic data only.
2. No automated profiling or decisions about individuals without a human involved.
3. Minimal personal data, with a credible privacy/EU AI Act story for real deployment.

## Working on this repo (humans + Claude Code + Codex)

```sh
scripts/setup.sh <your-name>   # once per clone: git hooks, rebase-on-pull, your team board
```

- **Agent instructions:** [AGENTS.md](AGENTS.md) is the single source for Claude Code and Codex (`CLAUDE.md` just imports it).
- **Flow:** trunk-based on `main`. Claim your task in `docs/team/<you>.md`, ship small slices often, and keep `main` running. `scripts/check.sh` is the only gate and also runs on `git push`.
- **Skills** (`.agents/skills/`, shared): `sync`, `ship`, `responsible-ai-check`, `synthetic-data`, `log-idea`, `decide`, `demo-ready`. Use `/name` in Claude Code, `$name` in Codex.
- **Codex users:** run `/hooks` once to trust the project hooks in `.codex/hooks.json`.

## Repo layout

```
AGENTS.md        agent + team rules (single source)
.agents/         shared hooks and skills for Claude Code and Codex
.githooks/       git hooks for everyone
scripts/         setup.sh, check.sh
docs/            challenge brief, constraints, pipeline, ideas, research, team boards
data/synthetic/  fictional companies, talent and events
```

App code will be added once the team chooses an idea and stack.
