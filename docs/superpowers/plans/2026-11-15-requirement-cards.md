# Requirement cards per company + saved-entry registry

Spec: this file (sections "Design" and "Global Constraints" are binding). Concept: `docs/pipeline.md`. Rules: `AGENTS.md` › Product rules.

## Goal

Today an applicant's evidence for a requirement is a **story linked to that requirement** (`Link` with status `accepted`). We change that:

1. The applicant opens **one company** (`/applicant/companies/[companyId]`) and fills in **each core-requirement card individually**: an example written for that requirement, in their own words.
2. **Stories become helpers only.** They (a) carry AI recommendations ("this story could fit #2", with a reason) and (b) let the applicant **start a card from a story** (prefill the text) so they don't write from scratch. A story is never itself the evidence.
3. Every saved card answer goes into a **registry of saved entries** (`/applicant/entries`, nav label "Saved entries"). When another company asks for the **same or a similar requirement**, the applicant can **reuse** a saved entry in one click instead of writing it again.

## Design

### Data

New zod schemas in `lib/domain/types.ts`:

```ts
/** One example the applicant wrote; lives in their registry and can answer several requirements. */
EntrySchema = z.object({
  id: z.string(),
  applicantId: z.string(),
  body: z.string(),
  languageLabel: LanguageLabelSchema.optional(),
  /** The story the applicant started from, if any (provenance only). */
  sourceStoryId: z.string().optional(),
});

/** The applicant's answer on one requirement card: which saved entry fills it. One per (applicant, requirement). */
AnswerSchema = z.object({
  applicantId: z.string(),
  requirementId: z.string(),
  entryId: z.string(),
});
```

`Db` gains `entries: Entry[]` and `answers: Answer[]` (types `Entry`, `Answer` exported). `emptyDb()` returns both as `[]`. **Backward compatibility:** a `db.json` or seed file without `entries`/`answers` must still parse, with both defaulting to `[]` (the runtime store reseeds on validation failure, which would wipe teammates' demo state — avoid that).

`Link` stays unchanged as a type; its meaning becomes **"a story recommended for a requirement"** (`pending` = shown as a recommendation, `accepted` = the applicant started a card from it, `rejected` = dismissed). Links never count as evidence any more.

### Domain functions — new file `lib/domain/entries.ts`

All return `Result<Db>` (except `entryMatches`), never mutate, and refuse with these error codes:

| Function | Behaviour | Errors |
|---|---|---|
| `writeAnswer(db, applicantId, requirementId, input: { body: string; sourceStoryId?: string })` | Trims body. Creates a **new** entry (id: next free `entry-<n>`, same scheme as `nextStoryId` in `stories.ts`) and makes it the answer for the requirement, replacing any previous answer for that (applicant, requirement). The previous entry stays in the registry. If `sourceStoryId` is given it must be the applicant's own story; the entry copies that story's `languageLabel` if it has one. If a `Link` exists for (sourceStoryId, requirementId), its status becomes `accepted`. | `empty-body`, `not-found` (unknown requirement or story not the applicant's) |
| `reuseEntry(db, applicantId, requirementId, entryId)` | Makes an existing entry of the applicant the answer for the requirement (replacing any previous answer). No new entry. | `not-found` |
| `editEntry(db, applicantId, entryId, body)` | Updates the entry body (trimmed) everywhere it is used. Keeps `languageLabel` and `sourceStoryId`. | `empty-body`, `not-found` |
| `clearAnswer(db, applicantId, requirementId)` | Removes the answer; the entry stays in the registry. | `not-found` (no answer) |
| `deleteEntry(db, applicantId, entryId)` | Removes the entry and every answer that uses it. | `not-found` |
| `entryMatches(db, applicantId, requirementId): EntryMatch[]` | The applicant's saved entries that could be reused for this requirement — see below. | — |

`entryMatches` returns `{ entry: Entry; kind: "same" | "similar" | "other"; sharedWords: string[]; usedFor: { requirementId: string; companyName: string; text: string }[] }[]`:

- Excludes the entry already answering this requirement.
- `usedFor` = requirements the entry currently answers (via `answers`), with company name.
- Word set of a requirement text: lowercase; split on anything that is not a Unicode letter (`/[^\p{L}]+/u`); drop words shorter than 4 letters; drop stopwords `with, from, into, under, over, that, this, they, them, their, about, other, each, when, what, have, been, your, using`; strip one trailing `s` from words longer than 4 letters.
- `kind: "same"` if any requirement in `usedFor` has the same normalised text as the target (lowercased, whitespace-collapsed, trimmed), else `"similar"` if the union of `usedFor` word sets shares ≥1 word with the target's word set (`sharedWords` = those words, sorted), else `"other"` (`sharedWords: []`).
- Order: `same` first, then `similar` by `sharedWords.length` descending, then `other`; ties by entry id ascending.
- This orders the applicant's **own entries**, never people. The UI shows `sharedWords` as the visible reason.

`setRequirements` in `lib/domain/requirements.ts` must also drop `answers` whose requirement is deleted (entries stay).

### What the recruiter sees (cards)

`lib/domain/cards.ts`: a slot's evidence comes from `answers` → `entries`, not links.

```ts
export type CardSlot = {
  requirement: Requirement;
  example: { entry: Pick<Entry, "id" | "body" | "languageLabel"> } | null;
};
```

`buildCard`, `coverage`, `filterByCoverage` keep their signatures; coverage counts slots whose `example` is not null. Every consumer of `slot.examples` (EvidenceCard, print card, meeting pages, home hero in `app/page.tsx`) switches to `slot.example`. The card line under an example says **"Written by applicant"** (+ `tag tag-ai` with the language label if present). No story title is shown.

`lib/domain/readiness.ts`: `ReadinessRow.acceptedLinks` becomes `answers` (number of answers the applicant has); the "needs help" rule keeps its shape: `stories === 0 || answers === 0`. Update the staff page wording accordingly.

`signals.ts` keeps "at least 1 example" via `coverage` — no change needed beyond cards.

### Server actions — new file `app/actions/entries.ts`

`"use server"`. One exported action per domain function except `entryMatches` (`saveAnswer`, `reuseSavedEntry`, `editSavedEntry`, `removeAnswer`, `deleteSavedEntry`). Same structure and guards as `app/actions/links.ts`: zod-validate inputs (ids `min(1).max(200)`, body `max(10_000)`), session applicant must exist, requirement ids must be **core requirements of a company at the session event** (`coreIdsAtEvent`), entries/stories must be the session applicant's (anything else is `not-found`), friendly error messages, `revalidatePath` for `/applicant/companies` (layout) and `/applicant/entries`. Return `{ ok: true } | { ok: false; error: string }`, never db contents. Move `coreIdsAtEvent` into `lib/domain/attendance.ts` (exported) so both action files share it.

`app/actions/links.ts`: remove `moveSuggestion` and `linkMyself` (and `moveLink`/`linkManually` + their tests in `lib/domain/links.ts` if nothing else uses them). Keep `saveSuggestions`, `acceptSuggestion` is no longer needed by the UI (accept happens via `writeAnswer`) — remove it too; keep `rejectSuggestion` (= "Dismiss").

### Applicant UI

- **`/applicant/companies`** (overview): each company card shows name, sector, coverage tag (existing `examplesLine`), its core requirements list (as today), and a primary link **"Fill in requirement cards"** → `/applicant/companies/[companyId]`. Remove the "Where your stories fit" section and `LinkSuggestions.tsx` from this page (its job moves to the detail page).
- **`/applicant/companies/[companyId]`** (new): `PageHeader` (eyebrow = pseudonym, title = company name, one-line intro: "Fill in one card per requirement, in your own words. Start from a story or reuse something you already wrote."). `notFound()` if the company is not at the session event. Button **"Suggest which of my stories fit"**: calls the existing `POST /api/ai/suggest-links` once per own story (sequentially), then `saveSuggestions` for each; shows `FALLBACK_NOTICE` when any response is `mock-fallback`; "No new suggestions" when nothing was added. Then one **requirement card** per core requirement, in rank order.
- **Requirement card** (`RequirementCard.tsx`, client): `req-no req-no-core` marker, requirement text, "In practice" line.
  - *Answered:* shows the entry body and language tag; "Also used for: <Company> #n" when the entry answers other requirements. Buttons: **Edit**, **Remove from this card**.
  - *Editing / empty:* textarea (label "Your example for this requirement, in your own words") + **Save**. When editing an entry used elsewhere, two buttons: **"Save everywhere it's used"** (`editSavedEntry`) and **"Save only for this card"** (`saveAnswer` → new entry). Cancel returns to the answered view.
  - Helper 1 — **"Reuse a saved entry"** (only if `entryMatches` is non-empty): `same` and `similar` matches listed openly with a reason chip — `same`: "Same requirement at <Company>"; `similar`: "Similar: both mention <words>" — plus a body preview (first ~160 chars) and **"Use this"** (`reuseSavedEntry`, no rewriting). `other` matches inside a `<details>` "Other saved entries".
  - Helper 2 — **"Start from a story"**: first the AI recommendations for this requirement (links `pending` to this requirement from own stories) inside `ai-panel` with `tag tag-ai` "AI suggestion", the reason ("Why: …"), **"Start from this story"** (prefills the textarea with the story body and remembers `sourceStoryId`; nothing is saved until Save) and **Dismiss** (`rejectSuggestion`). Then a select of all own stories + "Start from this story". Prefilling never overwrites text the applicant already typed without confirmation (`window.confirm`).
- **`/applicant/entries`** (new, nav "Saved entries" after "Companies" in `lib/nav.ts`): `PageHeader` "Saved entries" + one line: "Everything you wrote on requirement cards. Reuse an entry on any card that asks for the same thing." List each own entry: body, language tag, "Started from story: <title>" if `sourceStoryId`, "Used for: <Company> #n — <text>" list (or "Not used on any card"), **Edit** (inline, saves everywhere) and **Delete** (confirm; removes it from every card). Empty state: "Nothing saved yet. Fill in a requirement card on a company page."
- `/applicant/stories` stays as is; change its intro copy only if it says stories are linked as evidence.

### Seed data

`data/synthetic/generate.mjs` + `data/synthetic/talent/talent.json` (and the test fixture copy at `lib/store/__fixtures__/seed/talent/talent.json` only if tests rely on it): convert every seeded **accepted** link into an answer. One entry per (applicant, story) that has accepted links: `body` = story body, `languageLabel` = story's if present, `sourceStoryId` = story id; one answer per accepted link pointing at that entry (so one entry already serves several requirements — this demonstrates the registry). Seeded links stay as they are. Follow `data/synthetic/README.md`; run the `data/synthetic/seed.test.ts` test.

## Global Constraints

- Stack: Next.js 16 (this version differs from training data: read the relevant guide in `node_modules/next/dist/docs/` before writing routes/pages; dynamic route `params` is a Promise — copy the pattern from `app/(applicant)/applicant/meetings/[meetingId]/page.tsx`), React 19, TypeScript, Tailwind 4, zod 4, Vitest.
- Immutability: never mutate db objects/arrays; return new ones. Functions < 50 lines, files < 800 lines.
- UI: only classes from `app/globals.css` (`page`, `h1`/`h2`/`h3`, `card`, `panel`, `btn`/`btn-primary`/`btn-sm`, `field`, `field-inline`, `label`, `hint`, `req-no`/`req-no-core`, `tag`/`tag-ai`/`tag-success`/`tag-accent`, `ai-panel`, `empty-slot`, `notice-error`) and semantic colours (`text-muted`, `border-line`, `bg-surface`, `text-danger`); never raw `neutral-*`/`red-*`. AI content is always marked `tag tag-ai` or `ai-panel`.
- Product rules: AI never drafts or edits card text; it only recommends stories (with a visible reason) that the applicant can use or dismiss. Nothing is saved to a card without an explicit applicant action. No ranking of people. Synthetic data only.
- Tests (Vitest, `*.test.ts` next to the code) for all domain logic: `entries.ts`, the changed `cards.ts`, `readiness.ts`, `requirements.ts`. UI/glue code needs no tests. Test fixture builder: `lib/domain/fixtures.ts` (`makeDb`).
- Gate: `scripts/check.sh` (lint + typecheck + tests) green at the end of every task.
- Commits: conventional (`feat(applicant): …`, `refactor(cards): …`, `data: …`, `docs: …`), stage named files only (never `git add -A`), end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never `--no-verify`.

## Tasks

### Task 1: Entries domain model

Files: `lib/domain/types.ts`, `lib/domain/entries.ts` (new), `lib/domain/entries.test.ts` (new), `lib/domain/requirements.ts` (+ its test), `lib/domain/fixtures.ts`.

- Add `EntrySchema`, `AnswerSchema`, `Entry`, `Answer`, `Db.entries`, `Db.answers`, `emptyDb()` fields, backward-compatible `DbSchema` (missing arrays → `[]`; add a test that a db object without them parses).
- Implement every function in the "Domain functions" table exactly as specified, with tests covering each error code, replacement of a previous answer, entry reuse across requirements, language-label carry-over from a source story, link status → `accepted` on `writeAnswer` with `sourceStoryId`, and `entryMatches` kinds/order/sharedWords (include a "same" case across two companies with identical requirement text and a "similar" case such as "Writing clear care notes" vs "Writing incident reports" → `["writing"]`).
- `setRequirements` drops answers of deleted requirements (test).
- `makeDb` gains `entries: []`, `answers: []` defaults (keep existing fixture content working).

### Task 2: Cards, readiness and every card consumer read answers

Files: `lib/domain/cards.ts` (+ test), `lib/domain/readiness.ts` (+ test), `lib/domain/signals.test.ts` if it relies on links as evidence, `app/(recruiter)/recruiter/applicants/EvidenceCard.tsx`, `app/card/[meetingId]/print/page.tsx`, `app/(applicant)/applicant/meetings/[meetingId]/page.tsx`, `app/(recruiter)/recruiter/meetings/[meetingId]/page.tsx`, `app/page.tsx` (hero evidence slot), `app/staff/page.tsx`, `lib/domain/fixtures.ts` (give the fixture applicants entries/answers mirroring their accepted links so existing coverage/signal tests keep meaning).

- Implement the "What the recruiter sees" section. Hero in `app/page.tsx`: pick the first core requirement that has an answer; show the entry body (no story title — use the requirement text as the heading if a title is needed).
- Grep for every remaining `slot.examples`, `acceptedLinks` and evidence-by-link use and move it to answers.

### Task 3: Seed data carries entries and answers

Files: `data/synthetic/generate.mjs`, `data/synthetic/talent/talent.json`, `data/synthetic/README.md` (document the two new arrays), `data/synthetic/seed.test.ts`, the fixture copy under `lib/store/__fixtures__/seed/` only if needed.

- Implement the "Seed data" section. Regenerate `talent.json` with the script (don't hand-edit) and check the diff only adds `entries` and `answers`. Add a seed test: every answer points at an existing entry and core requirement, every entry belongs to an existing applicant.

### Task 4: Server actions for entries; trim link actions

Files: `app/actions/entries.ts` (new), `app/actions/links.ts`, `lib/domain/attendance.ts` (+ test for `coreIdsAtEvent`), `lib/domain/links.ts` (+ test).

- Implement the "Server actions" section. Remove `moveSuggestion`, `linkMyself`, `acceptSuggestion` and now-unused domain helpers with their tests. The old `LinkSuggestions.tsx` still imports them — delete `LinkSuggestions.tsx` and its usage on the companies page in this task so the build stays green (the page loses its story section until Task 5; acceptable within the branch).

### Task 5: Company detail page with requirement cards

Files: `app/(applicant)/applicant/companies/page.tsx`, `app/(applicant)/applicant/companies/[companyId]/page.tsx` (new), `app/(applicant)/applicant/companies/[companyId]/RequirementCard.tsx` (new), `app/(applicant)/applicant/companies/[companyId]/SuggestStoriesButton.tsx` (new), `app/(applicant)/applicant/companies/ui.ts`.

- Implement the overview and detail-page bullets of "Applicant UI". Server component computes everything (requirements, current answer + its `usedFor`, `entryMatches`, pending recommendations with story titles/bodies, own stories) and passes plain props to the client card. Keep client components under ~200 lines each; split helpers into small components in the same folder.

### Task 6: Saved-entries registry page

Files: `app/(applicant)/applicant/entries/page.tsx` (new), `app/(applicant)/applicant/entries/EntryItem.tsx` (new), `lib/nav.ts`.

- Implement the `/applicant/entries` bullet of "Applicant UI" and the nav item.

### Task 7: Docs

Files: `docs/pipeline.md`, `AGENTS.md` (Decisions log row), `app/(applicant)/applicant/stories/page.tsx` intro copy only if it describes stories as the evidence.

- `docs/pipeline.md`: in "Decisions so far" replace the "Story → requirement links" row's choice with: applicants fill in each company's core-requirement cards individually; stories are helpers (AI recommends a story for a requirement with a visible reason; the applicant can start a card from it or dismiss); every card answer is saved in the applicant's registry of saved entries and can be reused on any card asking for the same or a similar requirement (similarity = shared words, shown as the reason). Update journey step 2 bullets to match.
- `AGENTS.md` Decisions log: one row dated 2026-11-15 with the same decision and "Why: asked for per-company requirement cards filled individually, stories only as recommendations and a head start, and reuse of saved entries for repeated requirements".
