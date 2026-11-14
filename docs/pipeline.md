# Pipeline — No CV, No Job Ad

Working concept for the Espoo challenge. Evidence for each choice is in [research/README.md](research/README.md).

## Idea in one line

Recruiters commit to the 4 things they really hire on; applicants show one real example for each, in their own words; humans meet, talk about those 4, and both decide.

## What replaces the traditional documents

| Traditional document | Replaced by |
|---|---|
| Job ad with a long wishlist | **Ranked top 4** — the recruiter's own priorities, each with one line on what it looks like in practice |
| CV / application / online profile | **Evidence cards** — one real example per requirement, in the applicant's own words |

The CV can still be shared — after the conversation, if both sides want to continue.

## Decisions so far

| Decision | Choice |
|---|---|
| Recruiter requirements | Recruiter ranks their own requirements; the top 4 define the event conversation |
| AI and the applicant's words | Content is the applicant's own. AI asks questions; it may fix grammar or translate, always with a visible label ("language edited", "translated from …"). AI never drafts content. |
| Documents | No CVs, applications or online profiles before the meeting |
| Names | Hidden while recruiters choose whom to meet; revealed when a meeting is booked |
| Judging people | Humans only. No scores, rankings or "top match" lists about applicants. |
| Story → requirement links | Applicant tells stories first. AI suggests which company requirement a story could be evidence for, with a visible reason; the applicant accepts, rejects or moves each link. AI never changes the story. Cards show "linked by applicant". |
| Hackathon demo | Thin full journey: every step works end to end on synthetic data; the story + AI-link step gets the most depth. |

## The journey

### Before the event (2–3 weeks out)

**1. Recruiter sets the top 4**
- Pastes an existing job ad (optional); AI extracts the requirements as a list.
- Recruiter ranks them and commits to a top 4, adding one line per item: what it looks like in practice.
- AI pushes back on wishlists ("you marked 9 as must-have — which 4 would you actually hire on?"). The recruiter decides.

**2. Applicant builds evidence cards**
- Browses companies by their top 4 — no job ads.
- Builds a personal library of examples. AI asks recall questions (situation → what *you* did → what changed); the applicant writes or speaks the answer.
- Examples can come from anywhere: work, volunteering, studies, family business, caregiving.
- One example can serve several companies when they ask for the same thing.
- Grammar fixes and translation are labelled on the card.

**3. Applicant spends signals**
- Each applicant has a small number of interest signals per event (e.g. 3).
- Signals are how an applicant says "I chose you on purpose". Scarcity keeps them meaningful and keeps companies from being flooded.

**4. Recruiter chooses whom to meet**
- Sees only applicants who signalled them: evidence cards against their own top 4, no names.
- Picks who to meet. Name is revealed when the meeting is booked.

**5. Espoo staff support** *(proposal)*
- Staff see who is stuck (no cards, empty requirements) and offer a human coaching session.
- Staff never see a ranking or score of applicants.

### During the event

**6. The conversation**
- 15-minute 1:1 (in person or online), built on Espoo's existing TalentMatch format.
- Both sides see the same card: the recruiter's top 4 next to the applicant's examples.
- The talk goes through the 4 — a short structured interview, which is the best-evidenced conversation format.
- *(proposal)* Cards load before the event, so a platform crash at event start doesn't block the conversation.

### After the event

**7. Match or not**
- After the meeting, each side independently answers: **continue or not**.
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
- Attention through relevance, not polish: the recruiter sees evidence against *their own* top 4, plus the applicant's scarce signal
- Fact recall over confidence coaching — underselling comes from self-evaluation, not lack of salesmanship ([research 02](research/02-science-of-miscommunication.md))

## Still open

- Pain point #5: value proposition and getting attention (above)
- Number of signals per applicant
- What the recruiter sees if an applicant has examples for only some of the 4
