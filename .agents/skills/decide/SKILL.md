---
name: decide
description: Record a team decision (concept, stack, scope cut, data schema, naming) in the right docs so every human and agent picks it up on the next pull. Use when the team says "let's go with…", "we decided…", "drop X", or a mentor answer changes the plan.
---

# Record a decision

Agents only know what's in the repo. An undocumented decision gets undone by the next agent.

1. **Concept/product decisions** → the "Decisions so far" table in `docs/pipeline.md`. If it settles an open problem there, remove that problem.
2. **Stack, tooling, workflow, phase decisions** → the Decisions log table at the bottom of `AGENTS.md` (date, decision, why). If the phase changes (ideation → build → demo), update **Current phase** in `AGENTS.md` and the status line in `README.md`.
3. **Stack chosen?** Also add to `AGENTS.md` › Commands the exact run/dev/test commands, and make sure `scripts/check.sh` runs that package's lint and tests (it picks up `package.json` scripts named `lint`/`typecheck`/`test` and `pyproject.toml` with ruff/pytest automatically).
4. **Mentor answers** → add them to the relevant doc (usually `docs/challenge-brief.md` or `docs/constraints.md`) with "(mentor, <date>)".
5. Fix anything the decision makes wrong elsewhere (grep the docs for the old choice). One commit: `docs: decide <short>`, then push straight away.

Keep each entry to one or two lines. No decision is recorded without a "why".
