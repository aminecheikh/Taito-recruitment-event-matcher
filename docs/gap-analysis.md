# Gap Analysis — what we have, what we don't

Statuses updated 2026-11-15 after the pre-freeze slices; first written 2026-11-14, 21:00 · Checked against [technical-requirements.md](technical-requirements.md) at commit `801ca70`.
Method: read `lib/domain`, `lib/ai`, `lib/store`, `app/actions`, the pages and the seed data; ran `scripts/check.sh` (green, 351 tests after the 2026-11-15 slices). The UI was not clicked through, so screen-level claims come from the code.

Legend: ✅ built · 🟡 partly built · ❌ not built · ⏸ open product decision

## Summary

- **The MVP journey is complete end to end:** requirements → stories → AI links → signals → anonymous cards → meeting → scores and decision → reveal → share or feedback → staff help list. All 4 AI functions have guardrails, a mock fallback and rate limits.
- **The weak spots are brief-level, not code-level.** Two of the brief's 9 pain points have almost nothing on screen: **PP1** (getting companies to take part) and **PP9** (international recruitment). The brief also asks us to *demonstrate* privacy, and a judge can't see it today: there's no export, no delete and no stated purpose per field.

## By requirement

### Company need definition

| ID | Status | Evidence / gap |
|---|---|---|
| FR-C1 Job-ad extraction | ✅ | `extractRequirements` returns ≤ 15 phrases; guardrail drops phrases that score people; 30 s timeout; AI-tagged in `RequirementsEditor.tsx` |
| FR-C2 Rank, 1–5 core | ✅ | `validateCore` + "Which ones would you actually hire on?" message |
| FR-C3 "In practice" line | ✅ | Required for core requirements (`app/actions/requirements.ts` `checkContent`) |
| FR-C4 Meeting slots | 🟡 | Slots now come from the event's time window (30-minute grid, `companyOpenSlots`), shown on R2 ("x of y meeting slots open") and enforced in `requestMeeting`. The recruiter can't change the window; it is set in seed data |
| FR-C5 Cut-off date | ❌ Pitch | — |
| FR-C6 ESCO mapping | ❌ Pitch | — |

### Talent self-description

| ID | Status | Evidence / gap |
|---|---|---|
| FR-T1 Stories in own words | ✅ | Create, edit and **Delete story** (2026-11-15) |
| FR-T2 One follow-up question | ✅ | `cleanQuestion` enforces exactly one question, no scoring words |
| FR-T3 Grammar / translate with label | ✅ | Label persists on the card. Known limit: label honesty enforced in the UI only (no auth), documented in `constraints.md` |
| FR-T4 AI link suggestions | ✅ | ≤ 3, reason required, unknown ids and scoring language dropped |
| FR-T5 Accept / reject / move / link myself | ✅ | `app/actions/links.ts` |
| FR-T6 Browse companies by core requirements | ✅ | `applicant/companies` with coverage per company |
| FR-T7 Voice input | ❌ Pitch | — |

### Signalling and selection

| ID | Status | Evidence / gap |
|---|---|---|
| FR-S1 Limited signals | ✅ | `spendSignal`, `signalsLeft` |
| FR-S2 ≥ 1 accepted example to signal | ✅ | `no-accepted-example` error |
| FR-S3 Anonymous cards, every slot | ✅ | `buildCard` + `visibleApplicantName`; the data model has no protected attributes at all |
| FR-S4 Coverage filter, rule visible to applicants | ✅ | R2 filter, list sorted alphabetically by pseudonym (no hidden order); rule sentence on `applicant/signals` |
| FR-S5 Recruiter card scores | ✅ | `setScore` core-only, 0–10; weighted total out of 100 (`lib/domain/scores.ts`) |
| FR-S6 Request → accept → name revealed | ✅ | `requestMeeting` checks signal + slots; `acceptMeeting` |
| FR-S7 Screening at volume | ✅ | Decided 2026-11-15: rank-weighted score out of 100 plus "Weighted score at least" filter; unscored never hidden (`lib/domain/scores.ts`) |

### Event day

| ID | Status | Evidence / gap |
|---|---|---|
| FR-E1 Shared card | ✅ | Same `buildCard` on R3 and A4 |
| FR-E2 Printable card | 🟡 | Server-rendered, no AI calls. **Recruiter only**: the page checks `session.companyId`, so an applicant can't print their own card |
| FR-E3 Precomputed event-day data | ❌ Pitch | — |
| FR-E4 Online / hybrid meeting link | ❌ Pitch | — |

### After the event

| ID | Status | Evidence / gap |
|---|---|---|
| FR-A1 Conversation scores | ✅ | Required together with the company decision (`scores-missing`) |
| FR-A2 Blind decisions, joint reveal | ✅ | `recordDecision` / `revealDecisions` |
| FR-A3 Each side chooses what to share | ✅ | `saveShare` only after a match; applicant picks email / CV / portfolio |
| FR-A4 Feedback line per core requirement | ✅ | Required when the company says no |
| FR-A5 Keep / export library | ✅ | **Download my data** (JSON) on `/privacy` |

### Organiser

| ID | Status | Evidence / gap |
|---|---|---|
| FR-O1 Who needs help | ✅ | `needsHelp`, alphabetical, no scores; "offer coaching" button |
| FR-O2 Companies late with requirements | ✅ | `/staff` lists companies without core requirements, **Send reminder** |
| FR-O3 Event aggregates | ✅ | Pool strip for recruiters and `/staff/insights` (shows "Too few to compare yet" under 5 signals per group) |
| FR-O4 International support pointers | ✅ | Opt-in moving help, shown to the company only after both continue, with resource links |

### AI

| ID | Status | Evidence / gap |
|---|---|---|
| AI-1 No scoring/ranking by AI | ✅ | No AI function returns a number about a person; guardrails strip scoring language. Input guard (2026-11-15) refuses job-ad text that asks the AI to judge people |
| AI-2 AI never writes content | ✅ | Only questions, link reasons, labelled language edits |
| AI-3 AI labelled, user told | ✅ | `tag-ai` / `ai-panel` on all 5 AI surfaces; "You're talking to an AI" banner on stories |
| AI-4 Schema-validated output | ✅ | zod `Output.object` + `schema.parse` + guardrails |
| AI-5 Provider switch | ✅ | `AI_PROVIDER` = google / anthropic / openai / mock |
| AI-6 Fallback with notice | ✅ | `mock-fallback` → "AI unavailable — showing example" |
| AI-7 No protected attributes in prompts | ✅ | Prompts receive story body + requirements only |
| AI-8 No emotion / biometrics | ✅ | No audio, video or images processed |
| AI-9 Rate limit + spend caps | 🟡 | Per-client and global per-minute limits, then mock (never 429). Spend caps live in provider consoles, which we can't check from here |
| AI-10 Audit log of AI suggestions | 🟡 | Links keep `origin: ai-suggested` + `status` + `aiReason`, which is a log for link suggestions. Follow-up questions and language edits aren't logged beyond the label |

### Data and privacy

| ID | Status | Evidence / gap |
|---|---|---|
| DP-1 Synthetic data | ✅ | 4 companies (34 requirements), 8 applicants, 20 stories, 1 event; pre-commit hook guards email domains |
| DP-2 Purpose per personal field | ✅ | Field table with purposes on `/privacy` (`lib/domain/privacy.ts`) |
| DP-3 No protected attributes in matching | ✅ | Fields don't exist |
| DP-4 Name hidden until booked | ✅ | Tested |
| DP-5 Retention window | ❌ | — |
| DP-6 Export / delete my data | ✅ | **Download my data**, **Delete all my data**, **Delete story** |
| DP-7 Scores visible only to that company | ✅ | Recruiter pages filter by `session.companyId`; applicant pages don't read scores |
| DP-8 Secrets | ✅ | `.env` + `.env.example`, pre-commit key scan |

### Non-functional

| ID | Status | Evidence / gap |
|---|---|---|
| NF-1 Event-start load | 🟡 | Printable card + AI off the event-day path. No caching or precompute (not needed for a laptop demo; pitch it) |
| NF-2 Offline demo | ✅ | mock provider + JSON store + reset |
| NF-3 Timeouts | ✅ | 8 s default, 30 s extraction, 1 retry |
| NF-4 Few steps | ✅ | 4–5 screens per role |
| NF-5 Accessibility | 🟡 | Labels and semantic markup in place; not audited (keyboard pass, contrast check) |
| NF-6 Multilingual | 🟡 | Story translation only; UI is English |
| NF-7 Boundary validation | ✅ | zod in every action and AI route; 20 KB body cap |
| NF-8 Single process | ✅ | Serialised atomic JSON writes |
| NF-9 / CO-1–7 Real-deployment compliance | ❌ Pitch | Arguments exist in `constraints.md`; there's no pitch slide or in-app page yet |

### Tests

| ID | Status |
|---|---|
| TR-1 – TR-8 | ✅ All have test files; 351 tests pass |

## Brief pain points: coverage at a glance

| Pain point | Coverage |
|---|---|
| PP1 Companies don't trust the city's pool | ✅ Pool strip and event insights |
| PP2 Needs described late / unclearly | 🟡 Clear: yes (core + in practice + extraction). Late: no cut-off or staff nudge |
| PP3 Organisers can't see real capability | ✅ Evidence cards |
| PP4 Companies flooded | ✅ Scarce signals + coverage filter + slots |
| PP5 Talent can't describe skills | ✅ Stories + recall questions + AI links |
| PP6 AI-written CVs read by AI | ✅ No CVs; own words; labelled edits |
| PP7 Cumbersome platforms | ✅ No matching settings to configure |
| PP8 Crash at event start | 🟡 Print card only |
| PP9 International complexity | ✅ Translation, opt-in moving help after a match |

## Recommended next slices (smallest effort, biggest judging impact)

1. **Privacy you can see** (DP-2, DP-6, FR-T1): "Delete story" + "Download my data (JSON)" for applicants, and a `/privacy` page listing each field with its purpose, who sees it and when it's deleted. Answers the brief's "demonstrate how privacy would be protected".
2. **Organiser symmetry + PP2** (FR-O2): add "Companies without core requirements" next to "Who needs help" on the staff page. Reuses the same pattern.
3. **PP1 aggregate view** (FR-O3): event-level numbers only, e.g. signals per company and how many applicants cover all core requirements. This lets the city show a company "12 people chose you on purpose" without profiling anyone.
4. **PP9 after-match pointers** (FR-O4): a static list of public services (permits, relocation, onboarding) shown after a match. Copy only, no personal data.
5. **Small fixes:** applicant access to the printable card (FR-E2); recruiter sets meeting slots (FR-C4).
6. **Product decisions still open:** screening at volume and the scoring guide (FR-S7); whether applicants see their scores.
