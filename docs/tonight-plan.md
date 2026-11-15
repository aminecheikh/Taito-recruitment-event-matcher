# Tonight's plan (before the 08:00 freeze)

**Goal:** make scoring useful, fix what a judge would notice is missing, and add a few things no other team will have.

Detailed version for agents: [superpowers/plans/2026-11-15-judging-gaps-and-differentiators.md](superpowers/plans/2026-11-15-judging-gaps-and-differentiators.md).

## What we build, most important first

### Must have

1. **Scores that mean something.** Recruiter scores are weighted by the recruiter's own ranking: with 4 requirements, #1 counts 4×, #2 3×, #3 2× and #4 1×. The result is a score out of 100. The recruiter gets a table of applicants with each score and the weighted total, and can filter by coverage and by score. People nobody has scored yet are never hidden; they stay in a "Not scored yet" list.
2. **AI refuses to judge people.** If a recruiter types "Rank the applicants" or "Who should we hire?" into an AI box, Taito refuses and says a person decides. Normal job-ad text still works.
3. **Privacy you can click.** A page showing what we store, why, who sees it and when it's deleted. Applicants can download their data, delete a story, or delete everything.
4. **Late companies.** Staff see which companies haven't set their requirements, and which haven't joined the event. One click sends a reminder or an invite, and the recruiter sees it as a banner.

### Should have

5. **Why companies should come.** At the top of the recruiter's list: "7 people chose you on purpose · 4 cover all your requirements · 6 slots open."
6. **International help.** Applicants can tick "I'm moving to Finland or new here" and get links to permits and moving help straight away. The company only finds out after both decide to continue, then gets links for hiring help. *(It's after the match, not right after the meeting, so it can't affect the yes/no decision.)*
7. **Start from your CV.** The applicant pastes a CV, their LinkedIn About text or their own posts. The AI quotes parts that could make good stories, asks one question for each, and shows which requirements at the event the CV touches on. The AI never writes the story, and **the CV is not saved**. *(No LinkedIn link import: fetching LinkedIn breaks their rules and our "no real data" rule, and pasting gives the same result.)*

### If there's time

8. **AI asks recruiters questions too**, so both sides get the same help describing themselves.
9. **City view for staff:** where the applicant pool is thin, and a fairness check. *How we know someone used AI language help: when an applicant accepts an AI grammar fix or translation, their example gets a permanent label that recruiters see. The check asks whether labelled examples get fewer meetings. It needs no nationality data.*

### In the demo

- **Pull the plug:** turn the wifi off mid-demo. The AI falls back with a notice and the printed card still works.

## Rules we keep

- Only people give scores. AI never ranks, scores or picks anyone.
- Nobody gets filtered out before a person has read them.
- Groups smaller than 5 show "too few to compare", never a percentage.
- No more design changes tonight.
- Each piece ships on its own as soon as it works.

## Who and when

| Who | What |
|---|---|
| Amine + Claude | 1 → 2 → 3 → 4, then 5 and 6 |
| Mehdi | 7 (CV), since it's prompt work like his extraction prompt |
| Whoever is free | 8, 9, then the demo script and pitch |

| Time | Milestone |
|---|---|
| 05:00 | Anything not working is dropped and goes in the pitch as "next step" |
| 05:30 | Demo script and pitch updated |
| 06:00 | Rehearse, record backup video |
| 08:00 | Freeze |
| 10:00 | Submit |
