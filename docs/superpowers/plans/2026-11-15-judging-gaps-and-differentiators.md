# Judging Gaps and Differentiators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Before the 08:00 freeze:
- make recruiter scores useful (weighted by rank, a shortlist table);
- close the gaps a judge would notice (visible privacy, late companies, company value, international help);
- add AI help that starts from a CV;
- refuse AI inputs that ask to judge people.

**Architecture:** Every number and rule goes into pure, tested functions in `lib/domain/` (new: `privacy.ts`, `insights.ts`, `reminders.ts`, `movingHelp.ts`), called from server pages and server actions, following the existing `Result<Db>` + `updateDb` pattern. Static copy lives in `lib/content/`. New AI calls reuse `createAiFunctions` / `handle` / mock fallback in `lib/ai/`.

**Tech Stack:** Next.js 16 App Router (read `node_modules/next/dist/docs/01-app` before writing a route handler), TypeScript, zod 4, Vercel AI SDK, Vitest.

**Spec:** `docs/technical-requirements.md`, `docs/gap-analysis.md`, the human summary `docs/tonight-plan.md`. Product rules: `AGENTS.md`.

## Global Constraints

- AI never ranks, scores, filters or rejects people. Scores come only from recruiters; sorting by a recruiter's own scores is the recruiter's tool and is labelled as such.
- An applicant who hasn't been scored is never hidden by a score filter. They stay visible under "Not scored yet".
- Aggregates shown to staff are counts only. When a comparison group has fewer than `MIN_GROUP_SIZE = 5`, show "Too few to compare yet" instead of a rate.
- Anything AI-generated gets `tag tag-ai` or `ai-panel`; AI fallbacks show "AI unavailable — showing example".
- UI uses `app/globals.css` classes (`page`, `card`, `panel`, `btn`, `btn-primary`, `btn-sm`, `btn-danger`, `field`, `tag-ai`, `ai-panel`, `notice-error`, `empty-slot`) and semantic colours. Never raw `neutral-*` / `red-*`.
- Synthetic data only. No LinkedIn fetching or scraping. CV text is processed in the request and never stored.
- New `Db` collections and fields use `.default([])` / `.optional()` so existing `data/runtime/db.json` files still load.
- Server actions and routes return a status, never the `Db`, and validate input with zod.
- Stage named files only, conventional commits, ship each task with skill `ship`.
- Run skill `responsible-ai-check` before shipping Tasks 1, 2, 3, 6, 7, 8 and 9. Run skill `decide` for the scoring rule (Task 1) and the moving-help reveal rule (Task 6).
- Visual freeze: no palette, font or mascot changes.

## Review Focus

1. **Score filter hiding unread people:** with "weighted score at least 60", an applicant nobody has scored yet must still appear under "Not scored yet". Tested in Task 1.
2. **Non-contiguous ranks:** core requirements ranked 1, 2, 4, 6 (non-core in between) must get weights 4, 3, 2, 1 by position, not by raw rank. Tested in Task 1.
3. **"Moving help" leaking before a match:** the company must not see it on the card, the shortlist table, the meeting page before both say continue, or the printed card. Tested in Task 6.
4. **Input guard false positives:** a real job ad with "you'll maintain a ranked list of tickets" must pass. "Rank the applicants who signalled us" must be refused. Tested in Task 2.
5. **CV suggestions inventing text:** every excerpt the AI returns must appear in the pasted CV, or it is dropped. Tested in Task 7.

## Priority, owners and cut line

It's 02:30; rehearsal starts 06:00. That leaves about 3.5 h of build time. Not everything fits, so tasks are in priority order.

| Tier | Tasks | Who |
|---|---|---|
| 1 Must | 1 Scoring · 2 Input guard · 3 Privacy · 4 Late companies | amine + Claude |
| 2 Should | 5 Pool strip · 6 International help · 7 CV suggestions | 7 → mehdi (prompt work); 5, 6 → amine + Claude |
| 3 If time | 8 Recruiter questions · 9 Staff insights | whoever is free; otherwise pitch only |
| Last | 10 Demo + docs | whoever finishes first, by 05:30 |

**Cut line:** at 05:00, anything not green moves to "In a real deployment" in the pitch. Nothing half-built ships.

---

### Task 1: Weighted scores and shortlist table

**Product decision (record with skill `decide`):** each core requirement weighs by its position among the core requirements. With N core requirements, #1 weighs N, the last weighs 1. The weighted score is out of 100. This replaces the unused `totalScore` and closes the "scoring guide / screening at volume" open item in `pipeline.md`.

**Files:**
- Modify: `lib/domain/scores.ts`, `lib/domain/scores.test.ts`, `app/(recruiter)/recruiter/applicants/page.tsx`, `app/(recruiter)/recruiter/meetings/[meetingId]/page.tsx`, `app/(applicant)/applicant/signals/page.tsx`
- Create: `app/(recruiter)/recruiter/applicants/ShortlistTable.tsx`

**Interfaces:**
- Consumes: `coreRequirements(db, companyId)` (sorted by rank), `coverage`, `visibleApplicantName`.
- Produces:
  - `rankWeights(db: Db, companyId: string): Map<string, number>`
  - `weightedScore(db: Db, companyId: string, applicantId: string, stage: Score["stage"]): number | undefined`, which is `Math.round(100 * Σ(score × weight) / (10 × Σ weight))`, `undefined` until every core requirement is scored or when there are no core requirements
  - `type ShortlistRow = { applicantId: string; label: string; covered: number; total: number; scores: Record<string, number | undefined>; weighted?: number }`
  - `shortlist(db: Db, companyId: string, applicantIds: string[], filter: { minCovered: number; minWeighted?: number }): { scored: ShortlistRow[]; notScored: ShortlistRow[] }`: `scored` sorted by `weighted` descending, then label; `notScored` alphabetical; `minWeighted` applies to `scored` only
  - Delete `totalScore` and its tests (no callers)

- [ ] **Step 1: Write failing tests:**
  - `rankWeights_fourCore_givesFourThreeTwoOne`
  - `rankWeights_nonContiguousRanks_weighsByPosition`
  - `weightedScore_onlyTopRequirementFull_is40` (scores 10, 0, 0, 0)
  - `weightedScore_strongOnAllButFirst_is60` (0, 10, 10, 10)
  - `weightedScore_allTen_is100`
  - `weightedScore_oneMissing_isUndefined`
  - `weightedScore_noCore_isUndefined`
  - `shortlist_minWeighted_hidesLowScoredButKeepsNotScored`
  - `shortlist_coverageFilter_appliesToBothGroups`
- [ ] **Step 2: Run** `npx vitest run lib/domain/scores.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement**, then run again. Expected: PASS.
- [ ] **Step 4: Recruiter applicants page.**
  - Add a "Table / Cards" toggle (`?view=table`, default cards).
  - The table shows: Applicant (pseudonym) · Coverage "3 of 4" · one column per core requirement "#1 … #N" (score or "–") · Weighted (number or "not scored").
  - A "Weighted score at least" number field (0–100) next to the existing coverage filter.
  - Legend: "Your scores, weighted by your ranking: #1 counts 4×, #2 3×, #3 2×, #4 1×. Applicants you haven't scored stay listed below."
  - Each row links to `#card-<applicantId>` in the cards view.
- [ ] **Step 5: Meeting page.** Show the conversation's weighted score once every requirement is scored: "Weighted: 72 / 100. It informs your decision; it doesn't make it."
- [ ] **Step 6: Applicant signals page.** Add one sentence per company: "Acme weighs requirement 1 the most."
- [ ] **Step 7: Run** `scripts/check.sh` + `responsible-ai-check` + `decide`, then ship as `feat(scores): rank-weighted score and shortlist table`.

### Task 2: AI input guard

Replaces the separate "How Taito uses AI" page. The refusal happens where people actually type.

**Files:**
- Modify: `lib/ai/guardrails.ts`, `lib/ai/guardrails.test.ts`, `app/api/ai/extract-requirements/route.ts`, `app/(recruiter)/recruiter/requirements/RequirementsEditor.tsx`. Task 8's route uses it too.

**Interfaces:**
- Produces:
  - `HIRING_DECISION = /\b(?:should|do|would) (?:we|i) (?:hire|reject|pick|choose)\b|\bwho (?:should|to) (?:hire|reject|pick)\b|\bwho is (?:the )?(?:best|strongest|top)\b/i`
  - `judgesPeople(text: string): boolean`, true when the existing `SCORES_A_PERSON` or `HIRING_DECISION` matches (percentages alone don't trigger it)
  - `guardJobAd(text: string): { kind: "refuse" } | { kind: "ok"; text: string; removed: number }`, which drops lines where `judgesPeople` is true and refuses when nothing is left
  - `REFUSAL_MESSAGE = "Taito's AI doesn't rank, score or pick people. A person decides. It can help you describe what you need."`
  - Route behaviour: refused input → HTTP 422 `{ error: "judges-people", message: REFUSAL_MESSAGE }`, with no model call

- [ ] **Step 1: Write failing tests.**
  - `judgesPeople_rankingRequests_true`: "Rank the applicants who signalled us", "Who should we hire?", "Who is the best candidate?", "Give each applicant a score", "Filter out weak candidates", "Show me the top 3 applicants".
  - `judgesPeople_jobContent_false`: "Maintain a ranked list of support tickets", "Improve test scores of the build pipeline", "Reduced downtime by 30%".
  - `guardJobAd_mixedAd_removesOnlyJudgingLines`.
  - `guardJobAd_onlyInstruction_refuses`.
- [ ] **Step 2: Run.** Expected: FAIL. **Step 3: Implement**, then run again. Expected: PASS, and all existing guardrail tests still pass.
- [ ] **Step 4: Wire extraction.** The route calls `guardJobAd` before `extractRequirements`. The editor shows `REFUSAL_MESSAGE` in `notice-error` on 422, and "We skipped {removed} line(s) that asked to rank or score people." when `removed > 0`.
- [ ] **Step 5: Run** `scripts/check.sh` + `responsible-ai-check`, then ship as `feat(ai): refuse inputs that ask to judge people`.

### Task 3: Privacy page, export and delete (DP-2, DP-6, FR-T1)

**Files:**
- Create: `lib/domain/privacy.ts`, `lib/domain/privacy.test.ts`, `app/privacy/page.tsx`, `app/privacy/MyDataControls.tsx`, `app/api/me/export/route.ts`, `app/actions/privacy.ts`
- Modify: `lib/domain/stories.ts`, `lib/domain/stories.test.ts`, `app/actions/stories.ts`, `app/(applicant)/applicant/stories/StoryEditor.tsx`, `app/layout.tsx` (footer link "Privacy and your data")

**Interfaces:**
- Produces:
  - `RETENTION_DAYS = 30`
  - `PERSONAL_DATA_FIELDS: readonly { collection: keyof Db; field: string; purpose: string; whoSees: string; deletedWhen: string }[]`
  - `exportApplicantData(db: Db, applicantId: string): ApplicantExport | null`, where `ApplicantExport` holds the applicant, their stories, entries, answers and signals, their meetings (with `companyName`), their own decisions, company feedback only after the reveal, and shares. It never includes `scores`.
  - `deleteApplicantData(db: Db, applicantId: string): Result<Db>`: removes every record with that `applicantId`, plus their meetings' decisions and shares, plus links of their stories
  - `deleteStory(db: Db, applicantId: string, storyId: string): Result<Db>`: removes the story and its links, and unsets `sourceStoryId` on entries
  - Actions: `deleteStoryAction(storyId)`, `deleteMyDataAction()`

- [ ] **Step 1: Write failing tests:**
  - `privacy_everyPersonalField_hasAPurpose`: every `ApplicantSchema` key except `id`, plus `stories.body`, `entries.body`, `shares.applicant`, `scores.value` and `decisions.feedback`
  - `exportApplicantData_ownDataOnly`
  - `exportApplicantData_neverIncludesScores`
  - `exportApplicantData_feedbackOnlyAfterReveal`
  - `exportApplicantData_unknown_returnsNull`
  - `deleteApplicantData_removesEveryTrace` (`JSON.stringify` has no `"talent-017"`; other applicants' counts unchanged)
  - `deleteStory_own_removesStoryLinksAndEntrySource`
  - `deleteStory_otherApplicants_notFound`
- [ ] **Step 2: Run.** Expected: FAIL. **Step 3: Implement**, then run again. Expected: PASS.
- [ ] **Step 4: Build the UI.**
  - `/privacy`: the field table, "What the AI receives" (your text and requirement text, never your name or contact), "What we never collect" (photo, age, gender, nationality, language of origin, school name), and retention.
  - `MyDataControls` (applicant role only): "Download my data" (`/api/me/export`, `Content-Disposition: attachment; filename="taito-my-data.json"`) and a `btn-danger` "Delete all my data" with confirm.
  - `StoryEditor`: "Delete story" with confirm.
- [ ] **Step 5: Check by hand.** After "Delete all my data", the stories, companies, entries, signals and meetings pages show "Pick an applicant", not an error. Then press Reset.
- [ ] **Step 6: Run** `scripts/check.sh` + `responsible-ai-check`, then ship as `feat(privacy): privacy page, export and delete`.

### Task 4: Late companies: staff reminders and invites (PP2)

**Files:**
- Modify: `lib/domain/types.ts` (+ `ReminderSchema`, `Db.reminders`, `emptyDb`), `app/staff/page.tsx`, `app/(recruiter)/recruiter/requirements/page.tsx`, `app/(recruiter)/recruiter/applicants/page.tsx`
- Create: `lib/domain/reminders.ts`, `lib/domain/reminders.test.ts`, `app/actions/reminders.ts`, `app/components/ReminderBanner.tsx`

**Interfaces:**
- Produces:
  - `ReminderSchema = { id: string; eventId: string; companyId: string; kind: "set-requirements" | "join-event"; sentAt: string }`; `reminders: z.array(ReminderSchema).default([])`
  - `companiesWithoutCore(db, eventId): { companyId: string; name: string }[]`: companies at the event with 0 core requirements, alphabetical
  - `companiesNotAtEvent(db, eventId): { companyId: string; name: string }[]`, alphabetical
  - `sendReminder(db, input: { eventId; companyId; kind }, now: string): Result<Db>`, which returns `already-sent` for the same event, company and kind
  - `openReminders(db, companyId): Reminder[]`: a `set-requirements` reminder disappears once the company has core requirements; a `join-event` reminder disappears once it attends
  - `joinEvent(db, companyId, eventId): Result<Db>`, which adds a `companyEvents` row and returns `already-attending` on a duplicate
  - Actions: `sendReminderAction(companyId, kind)` (staff role), `joinEventAction(eventId)` (recruiter role, own company)

- [ ] **Step 1: Write failing tests:**
  - `companiesWithoutCore_onlyAtThisEvent`
  - `companiesNotAtEvent_listsOthers`
  - `sendReminder_duplicate_alreadySent`
  - `openReminders_resolvedOnceCoreSet`
  - `openReminders_resolvedOnceJoined`
  - `joinEvent_duplicate_alreadyAttending`
- [ ] **Step 2: Run.** Expected: FAIL. **Step 3: Implement**, then run again. Expected: PASS.
- [ ] **Step 4: Build the UI.**
  - `/staff`, under the applicant list:
    - "Companies without core requirements", with a "Send reminder" button that shows "Reminded" once sent
    - "Companies not at this event yet", with an "Invite" button
  - Recruiter: `ReminderBanner` on the requirements and applicants pages:
    - "Event staff reminded you to set your core requirements for {event}."
    - "Event staff invited you to {event}." with a "Join event" button
  - Note in the banner: "In a real deployment this would also be an email."
- [ ] **Step 5: Run** `scripts/check.sh`, then ship as `feat(staff): remind companies to set requirements and invite them to events`.

### Task 5: Recruiter pool strip (PP1)

**Files:**
- Create: `lib/domain/insights.ts`, `lib/domain/insights.test.ts`
- Modify: `app/(recruiter)/recruiter/applicants/page.tsx`

**Interfaces:**
- Produces: `poolSummary(db, eventId, companyId): { signalled: number; coverAll: number; coreCount: number; openSlots: number }` (uses `companyOpenSlots`)

- [ ] **Step 1: Write failing tests:** `poolSummary_countsSignalsAndFullCoverage` and `poolSummary_noCore_coverAllZero`. **Step 2:** FAIL. **Step 3:** Implement, then run again. Expected: PASS.
- [ ] **Step 4: Add a `panel` under the header:** "**7** people chose you on purpose · **4** have an example for all 4 core requirements · **6** meeting slots open". When there are 0 core requirements: "Set your core requirements to see who covers them."
- [ ] **Step 5: Run** `scripts/check.sh`, then ship as `feat(recruiter): pool summary strip`.

### Task 6: International help: applicant opt-in, revealed after a match (PP9)

**Decision to confirm (record with skill `decide`):** the company learns about it only after **both** say continue. If it showed after the meeting but before the decision, it could tip the decision against international applicants.

**Files:**
- Modify: `lib/domain/types.ts` (`ApplicantSchema` + `wantsMovingHelp: z.boolean().optional()`), `lib/domain/privacy.ts` (registry row), `app/(applicant)/applicant/meetings/page.tsx`, both meeting detail pages
- Create: `lib/content/internationalSupport.ts`, `app/components/InternationalSupport.tsx`, `app/actions/movingHelp.ts`, `lib/domain/movingHelp.ts`, `lib/domain/movingHelp.test.ts`

**Interfaces:**
- Produces:
  - `INTERNATIONAL_SUPPORT: readonly { name: string; url: string; helpsWith: string; audience: "applicant" | "company" | "both" }[]`, covering Work in Finland, InfoFinland, the Finnish Immigration Service and Business Espoo
  - `setMovingHelp(db, applicantId, on: boolean): Result<Db>`
  - `companySeesMovingHelp(db, meetingId): boolean`: true only when `revealDecisions` gives a match and the applicant opted in
  - Action `setMovingHelpAction(on: boolean)`

- [ ] **Step 1: Write failing tests:**
  - `companySeesMovingHelp_beforeMatch_false`
  - `companySeesMovingHelp_afterMatchOptedIn_true`
  - `companySeesMovingHelp_matchNotOptedIn_false`
  - `buildCard_neverContainsMovingHelp` (`JSON.stringify(buildCard(...))` has no `wantsMovingHelp`)
- [ ] **Step 2:** FAIL. **Step 3:** Implement, then run again. Expected: PASS.
- [ ] **Step 4: Build the UI.**
  - Applicant meetings page: a checkbox "I'm moving to Finland or new here and would like help with permits and moving", with the hint "Companies only see this after you both decide to continue." When checked, show the applicant resources right away.
  - Recruiter matched meeting: if the applicant opted in, show "This person would like help with permits and moving" plus the company resources.
- [ ] **Step 5: Check the URLs** with `curl -sIL -o /dev/null -w "%{http_code}\n" <url>` and keep only those returning 200.
- [ ] **Step 6: Run** `scripts/check.sh` + `responsible-ai-check` + `decide`, then ship as `feat(meetings): opt-in moving help, shown to the company after a match`.

### Task 7: Start from your CV (owner: mehdi)

The CV is a private source for stories, not a document companies see. It's paste-only (no PDF tonight) and **never stored**. LinkedIn: no fetching. The hint invites people to paste their own posts or "About" text into the same box.

**Files:**
- Create: `lib/ai/prompts/cvSuggestions.ts`, `app/api/ai/cv-suggestions/route.ts`, `app/(applicant)/applicant/stories/CvPanel.tsx`, `data/synthetic/talent/demo-cv-017.txt` (via skill `synthetic-data`)
- Modify: `lib/ai/guardrails.ts` + tests, `lib/ai/functions.ts` + tests, `lib/ai/mock.ts`, `app/(applicant)/applicant/stories/page.tsx`

**Interfaces:**
- Consumes: `isQuotedFrom(evidence, source)`, `cleanQuestion`, `coreIdsAtEvent(db, eventId)`.
- Produces:
  - `type CvSuggestions = { storyStarts: { excerpt: string; question: string }[]; relevant: { requirementId: string; excerpt: string }[] }`
  - `cleanCvSuggestions(raw: CvSuggestions, cvText: string, requirements: { id: string }[]): CvSuggestions`: drops excerpts not quoted from the CV, unknown requirement ids and failing questions, and keeps at most 5 of each
  - `cvSuggestions(input: { cvText: string; requirements: Pick<Requirement, "id" | "companyId" | "text" | "inPractice">[] }): Promise<AiResult<CvSuggestions>>`
  - `mockCvSuggestions(cvText, requirements)`: scripted for `demo-cv-017.txt`, generic otherwise (the first 3 bullet lines → "What happened when you …?")
  - Route body `{ cvText: string().min(50).max(15000) }`; the server takes requirements from the session event's core requirements; the route never writes to the store

- [ ] **Step 1: Write failing tests:**
  - `cleanCvSuggestions_excerptNotInCv_dropped`
  - `cleanCvSuggestions_unknownRequirement_dropped`
  - `cleanCvSuggestions_capsAtFive`
  - `cvSuggestions_noModel_returnsMock`
  - `cvSuggestions_modelThrows_fallsBack`
- [ ] **Step 2:** FAIL. **Step 3: Write the prompt:**
  - quote the CV exactly
  - for each quote, ask one recall question
  - never write the story
  - ignore names, age, nationality, photos and school names
  - no judgement of the person
  
  Then implement and run again. Expected: PASS.
- [ ] **Step 4: Build `CvPanel`** (an `ai-panel` on `/applicant/stories`, collapsed by default, titled "Start from your CV").
  - A textarea with the hint "Paste your CV, LinkedIn About text or your own posts. It is not saved."
  - Result 1, "Could make a good story": quote + question + "Start this story", which prefills the new-story title with the quote; the applicant writes the body.
  - Result 2, "Requirements at this event your CV touches on": company · requirement · quote, each linking to that company's card page.
- [ ] **Step 5: Run** `scripts/check.sh` + `responsible-ai-check`, then ship as `feat(applicant): story ideas from a pasted CV`.

### Task 8 (if time): AI asks recruiters recall questions

**Files:**
- Create: `lib/ai/prompts/recruiterFollowUpQuestion.ts`, `app/api/ai/recruiter-follow-up/route.ts`, `app/(recruiter)/recruiter/requirements/RecruiterFollowUp.tsx`
- Modify: `lib/ai/functions.ts` + tests, `lib/ai/mock.ts`, `RequirementsEditor.tsx` (under each in-practice field)

**Interfaces:**
- `RECRUITER_LADDER`, exactly:
  - "Think of someone who did this well on your team. What did they actually do?"
  - "What goes wrong in the first month if a new hire lacks this?"
  - "How would you notice this in a 15-minute conversation?"
  - "Could someone learn this in their first three months?"
- `nextRecruiterQuestion(input: { requirementText: string; inPractice: string; history: { question: string; answer: string }[] }): Promise<AiResult<string>>`, guarded by `cleanQuestion(question, input.inPractice)`
- Route: 422 `judges-people` when `judgesPeople` matches any answer (Task 2)
- UI: an "Ask me a question" button, the question in an `ai-panel`; the recruiter still writes the in-practice line

**Tests:**
- `nextRecruiterQuestion_noModel_returnsLadderQuestion`
- `nextRecruiterQuestion_scoringQuestion_fallsBack`
- `nextRecruiterQuestion_twoQuestions_fallsBack`

Ship as `feat(recruiter): AI recall questions for the in-practice line`.

### Task 9 (if time): Staff insights: skills demand and process fairness

**How we know about AI language help:** when an applicant accepts an AI grammar fix or translation, the entry gets a permanent `languageLabel` ("language edited" or "translated from …"). Recruiters see that label on the card (`EvidenceCard.tsx:64`). The check asks whether labelled entries lead to fewer meeting requests. That's the bias we might be creating, and it needs no nationality or language-of-origin data.

**Interfaces** (in `lib/domain/insights.ts`):
- `MIN_GROUP_SIZE = 5`
- `demandReport(db, eventId): { companyName; requirementText; rank; withExample; registered }[]`, sorted with the thinnest supply first (requirements, not people)
- `processCheck(db, eventId): { groups: { label: "Used AI language help" | "Own wording only"; signals: number; meetingsRequested: number }[]; comparable: boolean }`. Unit = one signal; it's "Used AI language help" when any entry answering that company's core requirements has a `languageLabel`

**Tests:**
- `demandReport_thinnestFirst`
- `demandReport_noCore_noRows`
- `processCheck_groupsByLanguageLabel`
- `processCheck_underFive_notComparable`

**Page:** `/staff/insights` (nav "Event insights" in `lib/nav.ts`). Optionally extend the seed with skill `synthetic-data` so both groups reach 5 signals.

Ship as `feat(staff): event insights`.

### Task 10: Demo, pitch and docs

- [ ] **Demo script beats, in journey order:**
  1. The recruiter pastes "Rank the applicants who signalled us" into the job-ad box and it's refused (Task 2).
  2. The applicant starts from a CV (Task 7).
  3. **Pull the plug:** turn wifi off during the story step. The AI fallback notice shows and the printed card still works.
  4. The recruiter's table with weighted scores and the "Not scored yet" group (Task 1).
  5. A match, then moving help appears (Task 6).
  6. Staff send a reminder (Task 4); then `/privacy` with download and delete (Task 3).
- [ ] **Pitch "What sets us apart":**
  - AI refuses to judge people, right where you type
  - both sides get help describing themselves
  - scores are human, weighted by the recruiter's own ranking, and nobody gets filtered out unread
  - international needs are revealed only after a match
  - privacy you can click
  
  Move cut tasks to "In a real deployment".
- [ ] **Update status** in `gap-analysis.md`, `technical-requirements.md` and `pipeline.md` (scoring decision). Add `AGENTS.md` decisions rows for the weighted scoring and for "moving help is revealed after a match".
- [ ] **Ship** as `docs: demo beats, pitch and status after pre-freeze scope`. Then run skill `demo-ready` at 06:00.
