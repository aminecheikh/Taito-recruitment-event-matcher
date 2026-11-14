---
name: demo-ready
description: Pre-submission and pitch checklist - feature freeze, demo path rehearsal, judging-criteria coverage, compliance story, README and submission. Use in the last hours before the deadline, or when asked about the demo, pitch, freeze or submission.
---

# Demo ready

## T-4h: scope freeze
- [ ] List what works end to end with synthetic data. Anything not on the demo path is cut or hidden, not half-shown.
- [ ] Write the demo path (5–7 clicks max) as a script in `docs/demo.md`: who the persona is, what they do, what the judge should notice.
- [ ] Update `AGENTS.md` › Current phase to "demo freeze: fixes only on the demo path".

## T-2h: harden the path
- [ ] Walk the demo path from a fresh clone (`scripts/setup.sh`, install, run). Fix every stumble.
- [ ] No live dependency that can fail on stage: cache or pre-compute LLM outputs used in the demo; have a fallback (recorded result, static JSON) if the network or API key dies.
- [ ] Event-start load story (pain point #8): what is static/cached, what degrades gracefully.
- [ ] `scripts/check.sh` green on main. Screenshots or a short screen recording as a backup.

## Pitch coverage (judging)
Map each to a concrete moment in the demo or one slide:
- [ ] Better matching, discovery and communication between companies and talent (which pain points, by number).
- [ ] Human decides: show where the human chooses, and that no score or ranking of people exists.
- [ ] Transparency: every suggestion shows its reason; AI edits are labelled.
- [ ] Fairness & inclusion: names hidden until a meeting is booked; no protected attributes in matching; multilingual/plain language.
- [ ] Privacy: data minimisation, retention, the GDPR/EU AI Act deployment story from `docs/constraints.md` (Annex III high-risk, Art. 14 oversight, DPIA).
- [ ] Adoptability for Espoo: fits their existing event format, what they'd need to run it next time.
- [ ] Run the `responsible-ai-check` skill over the final demo path.

## Submission
- [ ] README: one-paragraph pitch, screenshots, how to run, stack, team, "all data is synthetic".
- [ ] No secrets in history: `git log -p | grep -E "sk-|AKIA|ghp_"` returns nothing.
- [ ] Note the submitted commit: `git rev-parse HEAD`. Submit before the deadline, not at it.
