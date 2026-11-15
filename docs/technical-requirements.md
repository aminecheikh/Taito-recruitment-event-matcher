# Technical Requirements

Derived from the City of Espoo challenge brief ([challenge-brief.md](challenge-brief.md)), checked against [constraints.md](constraints.md) and our concept ([pipeline.md](pipeline.md)). Technical design: [superpowers/specs/2026-11-14-mvp-design.md](superpowers/specs/2026-11-14-mvp-design.md).

**Scope column:** `MVP` = must work in the hackathon demo · `Pitch` = described for a real deployment, not built.
**Source column:** the brief's pain point (PP1–PP9, listed below) or rule (R-…) each requirement answers.

## Pain points from the brief

| ID | Pain point |
|---|---|
| PP1 | Companies don't see the city as a credible source of candidates; free service = assumed low quality |
| PP2 | Companies describe their talent needs unclearly and too late (just before the event) |
| PP3 | Organisers get many applications but can't see real capabilities or how they fit needs, especially in tech |
| PP4 | Companies are overwhelmed by irrelevant candidate approaches during events |
| PP5 | Professionals struggle to describe competencies, transferable skills and value |
| PP6 | AI-written CVs read by AI: matching on synthetic representations, not real capability |
| PP7 | Event platforms with matching algorithms feel cumbersome |
| PP8 | Platforms crash when everyone logs in at event start |
| PP9 | International recruitment adds compliance, language, culture, relocation, onboarding complexity |

Rules from the brief: **R-HUMAN** no automated profiling or decisions about individuals without human involvement · **R-SYNTH** synthetic data only · **R-MIN** minimise personal data · **R-AIACT** show EU AI Act compliance in a real deployment · **R-FAIR** no disadvantage by nationality, language, education, career path · **R-JOURNEY** before, during and after the event.

---

## 1. Functional requirements

### 1.1 Company need definition (before the event)

| ID | Requirement | Acceptance criteria | Source | Scope |
|---|---|---|---|---|
| FR-C1 | A recruiter can paste an existing job ad and get a list of extracted requirement phrases | ≤ 15 short phrases; nothing invented that isn't in the text; result editable before saving | PP2 | MVP |
| FR-C2 | A recruiter ranks requirements and marks 1–5 as **core** | 6th core requirement is blocked with a prompt to choose; ranks unique; deterministic rule, not AI | PP2, PP4 | MVP |
| FR-C3 | Each core requirement has a one-line "what it looks like in practice" | Field required before the requirement can be core | PP2, PP3 | MVP |
| FR-C4 | A company sets its number of meeting slots per event | Integer, default 10; visible to the recruiter on the applicants screen | PP4 | MVP |
| FR-C5 | Requirements are locked or flagged as late after a cut-off date before the event | Cut-off set per event; late edits visible to organiser | PP2 | Pitch |
| FR-C6 | Requirements can be mapped to ESCO skill concepts as a shared vocabulary (translator, not scorer) | ESCO id stored alongside the company's own wording; never used to rank people | PP3, PP9 | Pitch |

### 1.2 Talent self-description

| ID | Requirement | Acceptance criteria | Source | Scope |
|---|---|---|---|---|
| FR-T1 | An applicant writes stories (real examples) in their own words, from any context (work, volunteering, studies, caregiving) | No CV upload; free text; no required fields about identity | PP5, PP6 | MVP |
| FR-T2 | AI asks one recall follow-up question at a time (situation → own action → result → detail) | Exactly one question; never proposes content or wording; never "confidence" coaching | PP5 | MVP |
| FR-T3 | AI can fix grammar or translate a story | Shown as a diff; saved only on accept; card carries a permanent label ("language edited" / "translated from …") | PP6, PP9, R-FAIR | MVP |
| FR-T4 | AI suggests which company requirement a story could be evidence for | ≤ 3 suggestions per story, each with a reason quoting the story; no score; empty list allowed | PP5 | MVP |
| FR-T5 | The applicant accepts, rejects or moves each suggested link | Only accepted links appear to recruiters; link shows "linked by applicant" | PP5, R-HUMAN | MVP |
| FR-T6 | Applicant can browse companies by their core requirements (no job ads) | Each company shows core requirements + in-practice lines + coverage rule | PP2, PP7 | MVP |
| FR-T7 | Voice input for stories | Speech-to-text only; no voice analysis (accent, tone, emotion) | PP5, PP9 | Pitch |

### 1.3 Signalling and selection (before the event)

| ID | Requirement | Acceptance criteria | Source | Scope |
|---|---|---|---|---|
| FR-S1 | Each applicant has a fixed number of interest signals per event | Default 3; remaining count visible; no duplicates | PP4 | MVP |
| FR-S2 | An applicant can signal a company only with ≥ 1 accepted example for its core requirements | Button disabled with reason otherwise | PP4, PP3 | MVP |
| FR-S3 | Recruiter sees only applicants who signalled them, as anonymous cards with every core slot | Pseudonym only; empty slots show "no example yet"; no name, photo, age, nationality, education institution | PP4, R-FAIR | MVP |
| FR-S4 | Recruiter filters by coverage (all core requirements first, then one fewer, …) | Deterministic; the rule is shown to applicants in advance | PP4, R-HUMAN | MVP |
| FR-S5 | Recruiter may score each card 0–10 per core requirement | Entered by the recruiter only; weighted total out of 100, weights follow the recruiter's own order (N core: #1 weighs N … last weighs 1); applicants without scores are never hidden by the score filter; visible only to that company | PP3, R-HUMAN | MVP |
| FR-S6 | Recruiter requests a meeting; applicant accepts; name revealed only when booked | Two-sided opt-in; booking blocked when slots are full | PP4, R-HUMAN | MVP |
| FR-S7 | Screening guidance when more applicants cover all requirements than there are slots | Decided 2026-11-15: rank-weighted score, no cut on #1 alone | PP4 | Built ✅ |

### 1.4 During the event

| ID | Requirement | Acceptance criteria | Source | Scope |
|---|---|---|---|---|
| FR-E1 | Both sides see the same shared card: core requirements next to the applicant's examples | Same content on recruiter and applicant views | PP3, PP7 | MVP |
| FR-E2 | The card is printable and works offline | `card/[meetingId]/print` renders without client JS or AI calls | PP8 | MVP |
| FR-E3 | Event-day schedule and cards are precomputed before the event | No AI call and no heavy query on the event-day path | PP8 | Pitch |
| FR-E4 | Works for in-person, online and hybrid meetings | Online meeting link field on a booked meeting; no platform lock-in | R-JOURNEY | Pitch |

### 1.5 After the event

| ID | Requirement | Acceptance criteria | Source | Scope |
|---|---|---|---|---|
| FR-A1 | Recruiter scores the conversation 0–10 per core requirement | Score informs, never decides; not shown to the applicant (pending decision) | PP3, R-HUMAN | MVP |
| FR-A2 | Each side independently says continue / not; answers revealed together | Neither side sees the other's answer before both submit; match = both continue | R-HUMAN | MVP |
| FR-A3 | On match, each side chooses what to share | Applicant: contact, CV, links; company: contact person, next step, timeline. Nothing shared without the owner's action | R-MIN | MVP |
| FR-A4 | On no match, recruiter writes one human feedback line per core requirement | Shown to applicant after reveal; AI does not write it | PP5, R-HUMAN | MVP |
| FR-A5 | Applicant keeps their story library for the next event | Stories survive event deletion; export and delete available | PP5, R-MIN | Built ✅ |

### 1.6 Organiser (City of Espoo staff)

| ID | Requirement | Acceptance criteria | Source | Scope |
|---|---|---|---|---|
| FR-O1 | Staff see who needs help (0 stories or 0 accepted links) and offer a human coaching session | Alphabetical by pseudonym; no scores, no ranking | PP3, PP5 | MVP |
| FR-O2 | Staff see which companies have not set core requirements by the cut-off | List with days remaining | PP2 | Built ✅ |
| FR-O3 | Event-level aggregates for organisers and companies (signals per company, coverage gaps across the event, match rate) | Aggregates only, never per-person; used to show companies the value of the city's pool | PP1 | Built ✅ |
| FR-O4 | International-recruitment support pointers attached to a match (permits, relocation, onboarding services) | Static, curated links from public services; shown to the company after a match, only if the applicant opted in | PP9 | Built ✅ |

---

## 2. AI requirements

| ID | Requirement | Acceptance criteria | Source |
|---|---|---|---|
| AI-1 | AI never scores, ranks, filters or rejects people, and never shows "top match" lists | No AI function returns a number or order about an applicant; code review + `responsible-ai-check` | R-HUMAN, R-AIACT |
| AI-2 | AI never writes the applicant's content | Only questions, link suggestions with reasons, and labelled language edits | PP6 |
| AI-3 | Every AI output is marked as AI and is a suggestion a person accepts or rejects | `tag-ai` / `ai-panel` on all AI UI; users are told when they interact with AI | R-AIACT (Art. 50) |
| AI-4 | Every AI output is structured and validated | zod schema per function; invalid output → fallback, never raw text in the UI | Robustness |
| AI-5 | Provider-agnostic: Claude, Gemini, OpenAI or scripted mock, selected by `AI_PROVIDER` | Switching needs no code change | Demo resilience |
| AI-6 | On provider error, timeout or rate limit, fall back to mock with a visible "AI unavailable — showing example" | Demo path works with no network | PP8 |
| AI-7 | Prompts exclude protected attributes | AI inputs contain story text and requirements only; never name, nationality, age, gender, photo, education institution | R-FAIR, R-MIN |
| AI-8 | No emotion recognition or biometric inference | No video, voice-tone or facial analysis anywhere | EU AI Act Art. 5(1)(f) |
| AI-9 | Per-visitor rate limit on AI routes and provider spending caps on the hosted copy | Limit exceeded → mock fallback, not an error page | Cost, abuse |
| AI-10 | Log what AI suggested and what the person did with it (accept/reject/move) | Log holds ids and outcome, not story text | R-AIACT (Art. 12), audit |

## 3. Data and privacy requirements

| ID | Requirement | Acceptance criteria | Source |
|---|---|---|---|
| DP-1 | All data is synthetic and obviously fictional | Companies end in "(fictional)"; reserved email domains only (pre-commit hook enforces); follows `data/synthetic/README.md` | R-SYNTH |
| DP-2 | Every personal-data field has a stated purpose | Purpose noted next to each field in `lib/domain/types.ts` | R-MIN, GDPR Art. 5 ✅ built |
| DP-3 | No matching feature uses nationality, language of origin, age, gender, name, photo or education institution | These fields don't exist or aren't read by matching/link code | R-FAIR |
| DP-4 | Identity is hidden until a meeting is booked | `visibleApplicantName` returns pseudonym unless `booked`; tested | R-FAIR, R-MIN |
| DP-5 | Retention: event data not carried into a match is deleted after a fixed window (e.g. 30 days) | Window configurable per event | GDPR Art. 5(1)(e) |
| DP-6 | Applicant can export and delete their library at any time | JSON export; hard delete | GDPR Art. 15, 17, 20 ✅ built |
| DP-7 | Recruiter scores are visible only to recruiters of that company | Not exposed on applicant or staff routes | R-MIN |
| DP-8 | Secrets in `.env` only; repo is public at judging | `.env.example` lists names only; pre-commit blocks keys | Security |

## 4. Non-functional requirements

| ID | Requirement | Acceptance criteria | Scope |
|---|---|---|---|
| NF-1 | Event-start load spike: everyone joining at once must not take the event down | Event-day pages are static or cached; cards printable; AI not on the critical path | MVP (print + mock), Pitch (CDN/precompute) |
| NF-2 | Demo works fully offline | `AI_PROVIDER=mock` + local JSON store; reset button reseeds | MVP |
| NF-3 | AI calls respond within a bounded time | Timeout per function; fallback after timeout; job-ad extraction has a longer budget | MVP |
| NF-4 | Simple to use: few steps, plain language | Each role completes its journey in ≤ 5 screens; no matching-algorithm settings to configure | MVP |
| NF-5 | Accessible | Semantic HTML, keyboard reachable, readable contrast in light and dark mode (design tokens in `app/globals.css`) | MVP |
| NF-6 | Multilingual-ready | UI copy in plain English for the demo; translation of stories labelled; UI i18n in a real deployment | MVP (stories), Pitch (UI) |
| NF-7 | Input validation at every boundary | Server actions and API routes validate with zod; reject unexpected shapes | MVP |
| NF-8 | Single-process deployment for the demo | One Node process with a writable disk (not serverless), because the store is a JSON file | MVP |
| NF-9 | Real deployment: EU-region hosting, DPA with the AI provider, auth, database | Described in the pitch | Pitch |

## 5. Compliance requirements (real deployment, for the pitch)

| ID | Requirement | Reference |
|---|---|---|
| CO-1 | Treat the system as high-risk AI (recruitment) and document how each obligation is met | EU AI Act Annex III 4(a), Art. 6(3) |
| CO-2 | Human oversight designed in: every decision about a person is made by a person | AI Act Art. 14, GDPR Art. 22 |
| CO-3 | Risk management, bias examination of prompts and link suggestions | AI Act Art. 9, 10 |
| CO-4 | Technical documentation and logging of AI suggestions and outcomes | AI Act Art. 11, 12 |
| CO-5 | Fundamental rights impact assessment (public-sector deployer) and DPIA | AI Act Art. 27, GDPR Art. 35 |
| CO-6 | Lawful basis: public task for the core service, consent for optional extras (confirm with Espoo) | GDPR Art. 6(1)(e) |
| CO-7 | Privacy by design and by default | GDPR Art. 25 |

## 6. Testing requirements

Test the logic whose failure would embarrass us in the demo (AGENTS.md); no coverage gate.

| ID | Must be tested |
|---|---|
| TR-1 | Core requirement validation (1–5, unique ranks) |
| TR-2 | Signal spending (limit, duplicates, ≥ 1 accepted example) |
| TR-3 | Coverage count and coverage filter |
| TR-4 | Score totals (undefined until every core requirement is scored) |
| TR-5 | Card building and name hiding before booking |
| TR-6 | Decision reveal (hidden until both submit; match = both continue) |
| TR-7 | AI output schemas, mock fallback, guardrails, rate limit |
| TR-8 | Staff readiness list (no scores, alphabetical) |

## 7. Open questions

- Screening at volume (FR-S7): decided 2026-11-15, weighted score. Scoring guide (how to read 0–10): still open.
- Does the applicant see their scores or only the feedback lines?
- Number of signals per applicant and meeting slots per company: confirm with Espoo mentors.
- How to address PP1 (company engagement) beyond aggregates: ask Espoo mentors what would convince a company.
- Value proposition one-liner for applicants (pipeline.md, open problem).
