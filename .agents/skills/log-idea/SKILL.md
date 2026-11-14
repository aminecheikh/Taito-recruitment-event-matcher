---
name: log-idea
description: Add an idea or feature variant to docs/ideas.md using its template and score it with the rubric. Use during ideation, when someone says "what if we…", or when comparing options before the team commits.
---

# Log an idea

1. Read the template and rubric at the top of `docs/ideas.md`, and skim existing ideas so you don't duplicate one (extend it instead).
2. Fill every template field. "What the AI does (and what a human decides)" and "Personal data needed" must be concrete; if they're vague, the idea isn't ready.
3. Score each rubric criterion 1–5 with a few words of reason, citing pain-point numbers from `docs/challenge-brief.md` and evidence from `docs/research/` where relevant. Be honest: a 5 needs a reason a judge would accept.
4. Run the `responsible-ai-check` table on it mentally; any FIX goes into the idea as a risk.
5. Append under `## Ideas`, commit `docs(ideas): <name>` and push (see `ship`). Ideas only go into `docs/pipeline.md` once the team decides (see `decide`).
