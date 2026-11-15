# Pipeline — Taito

Working concept for the Espoo challenge. Evidence for each choice is in [research/README.md](research/README.md).

## Idea in one line

Recruiters commit to the few things they really hire on (up to 5 core requirements); applicants show one real example for each, in their own words; humans meet, talk about those requirements, and both decide.

## What replaces the traditional documents

| Traditional document | Replaced by |
|---|---|
| Job ad with a long wishlist | **Core requirements** — 1 to 5, ranked by the recruiter, each with one line on what it looks like in practice |
| CV / application / online profile | **Evidence cards** — one real example per requirement, in the applicant's own words |

The CV can still be shared — after the conversation, if both sides want to continue.

## Decisions so far

| Decision | Choice |
|---|---|
| Recruiter requirements | Recruiter ranks their own requirements and picks **1 to 5 core requirements** (maximum 5); these define the event conversation |
| AI and the applicant's words | Content is the applicant's own. AI asks questions; it may fix grammar or translate, always with a visible label ("language edited", "translated from …"). AI never drafts content. |
| Documents | No CVs, applications or online profiles before the meeting |
| Names | Hidden while recruiters choose whom to meet; revealed when a meeting is booked |
| Judging people | Humans only. The **recruiter** scores each core requirement 0–10 (total out of 10 × number of core requirements). AI never scores, ranks or picks people, and shows no "top match" lists (the recruiter-asked search below is a lookup, not a ranking). Scoring guide and how scores are used to screen at volume: **open, being researched by two teammates**. |
| Signalling | An applicant needs at least 1 accepted example for a company before they can signal it. The recruiter sees every core-requirement slot; empty ones show "no example yet". |
| Shortlisting | The recruiter filters by coverage: how many core requirements have an example (all first, then one fewer, …). The rule is visible to applicants. |
| AI search of cards (recruiter) | Optional, closed by default. The recruiter asks for what to look for ("Python evidence but no SQL"); AI lists the applicants whose card text fits, each with a short reason quoting the card, and an "interpretation" line to check it understood. It only searches the list already shown, never sees scores or names (pseudonymous aliases), never selects or acts; the recruiter ticks people and invites or marks for later. Applicants are told on their cards page. Decided 2026-11-15: a faster read for the recruiter, not a filter that decides. Also decided 2026-11-15: a "Suggested filters" dropdown, built once per job from the cards on the list, offers 5–10 evidence filters about the core requirements (never identity traits, never quality words; each shows its match count). Nothing applies until the recruiter clicks one; applied filters are removable chips combined with AND, and the reason per applicant sits behind an info icon. |
| Job ad → suggested requirements | Job ads describe tasks, not needs. AI infers the skills, knowledge and tools the described work relies on (concise names, optional "in practice" line), each grounded in the ad; never identity traits. Shown as "AI suggestion"; the recruiter keeps, edits or deletes each one. |
| Story → requirement links | Applicant tells stories first. AI suggests which company requirement a story could be evidence for, with a visible reason; the applicant accepts, rejects or moves each link. AI never changes the story. Cards show "linked by applicant". |
| Product name | **Taito**, Finnish for "ability" (replaces the working title "No CV, No Job Ad"): the product is about what people can do, not their documents |
| Hackathon demo | Thin full journey: every step works end to end on synthetic data; the story + AI-link step gets the most depth. |

## The journey

### Before the event (2–3 weeks out)

**1. Recruiter sets the core requirements**
- Pastes an existing job ad (optional); AI suggests the requirements the described work needs, each with an optional "in practice" line.
- Recruiter ranks them and commits to 1–5 core requirements, adding one line per item: what it looks like in practice.
- AI pushes back on wishlists ("you marked 9 as must-have — which ones (at most 5) would you actually hire on?"). The recruiter decides.

**2. Applicant builds evidence cards**
- Browses companies by their core requirements — no job ads.
- Builds a personal library of examples. AI asks recall questions (situation → what *you* did → what changed); the applicant writes or speaks the answer.
- Examples can come from anywhere: work, volunteering, studies, family business, caregiving.
- One example can serve several companies when they ask for the same thing.
- Grammar fixes and translation are labelled on the card.

**3. Applicant spends signals**
- Each applicant has a small number of interest signals per event (e.g. 3).
- An applicant can signal a company only with at least 1 accepted example for its core requirements.
- Signals are how an applicant says "I chose you on purpose". Scarcity keeps them meaningful and keeps companies from being flooded.

**4. Recruiter chooses whom to meet** — a funnel, every step done by the recruiter
- Sees only applicants who signalled them: evidence cards against their own core requirements, every slot shown, no names.
- The company has a fixed number of meeting slots *(proposal: set in step 1, e.g. 10)*.
- **4a. Coverage filter.** Filter by how many core requirements have an example: all of them first, then one fewer, and so on. Applicants see this rule while they build their cards.
- **4b. Screening at volume — open.** When more applicants cover every core requirement than there are slots (e.g. 100 for 10 slots), how the recruiter narrows the list is being researched by two teammates. Ruled out: cutting on requirement #1 before reading the rest, because someone strong on the others but weak on #1 would be screened out.
- The recruiter requests meetings; the applicant accepts; the name is revealed when the meeting is booked.

- **4c. AI search (optional).** The recruiter can ask an AI helper to find cards with or without certain evidence; it returns a list with a reason per applicant, and the recruiter ticks whom to invite or mark for later. The AI can also suggest evidence filters for the job, which the recruiter may apply as chips. Invited applicants leave the list.

Why this stays human-decided: the coverage rule is set and applied by the recruiter and is visible to applicants; every score is a person's judgment; the AI search only answers the recruiter's question with reasons from the cards, and the recruiter picks every person.

**5. Espoo staff support** *(proposal)*
- Staff see who is stuck (no cards, empty requirements) and offer a human coaching session.
- Staff never see a ranking or score of applicants.

### During the event

**6. The conversation**
- 15-minute 1:1 (in person or online), built on Espoo's existing TalentMatch format.
- Both sides see the same card: the recruiter's core requirements next to the applicant's examples.
- The talk goes through the core requirements — a short structured interview, which is the best-evidenced conversation format.
- *(proposal)* Cards load before the event, so a platform crash at event start doesn't block the conversation.

### After the event

**7. Match or not**
- After the meeting, the recruiter scores the conversation on each core requirement (0–10). Scoring guide: open (see Still open).
- Each side independently answers: **continue or not**. The score informs the recruiter's answer; it never decides it.
- Answers are revealed together. A match happens only if both say continue.
- Humans decide on both sides. No AI suggestion is shown at this step.

**8. If it's a match — information transfer**
- The applicant chooses what to share: contact details, CV, portfolio, links.
- The company shares: named contact person, next step, expected timeline.
- Nothing moves between the two sides without the owner's explicit action.

**9. If it's not a match — closure**
- The recruiter leaves one short line per requirement (e.g. "#1 clear example", "#3 would like to see more depth").
- The applicant gets human-written feedback instead of silence, and their evidence library stays theirs for the next event.

**10. Data retention** *(proposal)*
- Event data not carried into a match is deleted after a fixed window (e.g. 30 days). The applicant can export or delete their library at any time.

## Open problem: describing competencies and transferable skills

Pain point #5: *"Many professionals find it difficult to describe their competencies, transferable skills and value proposition in a way that attracts the attention of recruiters."*

The evidence card handles "describe what you did". Still open:

1. ~~**Transferable skills**~~ — **decided:** story first, AI-suggested links the applicant confirms (see Decisions so far).
2. **Value proposition** — beyond single examples, how does the applicant say in one line what they bring, in their own voice?
3. **Getting attention** — what makes a recruiter stop on a card, without rewarding polish over substance?

Starting points from the research (to brainstorm, not decided):
- AI suggests a possible link and the applicant confirms or rejects it: "This sounds like it could be evidence for #2 'explaining tech to non-technical staff' — does that fit?" ([research 03](research/03-psychology-methods.md), question bank)
- A shared skills vocabulary (ESCO) as a translator between domains, not as a scorer ([research 06](research/06-matching-research.md))
- A reflection step after the cards: "Looking at your examples, what do they have in common?" → applicant writes their own one-liner
- Attention through relevance, not polish: the recruiter sees evidence against *their own* core requirements, plus the applicant's scarce signal
- Fact recall over confidence coaching — underselling comes from self-evaluation, not lack of salesmanship ([research 02](research/02-science-of-miscommunication.md))

## Still open

- Pain point #5: value proposition and getting attention (above)
- Number of signals per applicant
- Scoring guide (being researched by two teammates)
- Does the applicant see their scores, or only the feedback lines?
- Screening at volume (e.g. 100 applicants cover every requirement): two teammates are researching this. Rejected: scoring requirement #1 first and cutting before reading the others — someone strong on #2–#5 but weak on #1 gets screened out.
- Confirm meeting slots per company (step 4)
- Minimum number of core requirements (currently 1)
