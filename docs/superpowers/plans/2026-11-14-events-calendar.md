# Events and 30-minute meeting calendar

Spec: `docs/superpowers/specs/2026-11-14-mvp-design.md` (data model, roles) plus the product answers below, given by the human on 2026-11-14.

## Product answers (binding)

- Events happen on different days. Each event has a date, a start and end time (e.g. 14:00–18:00) and a fictional location.
- The event's time is split into 30-minute slots. That grid is everyone's calendar for that event.
- A recruiter (company) or applicant has reached their maximum for an event when every slot in their calendar for THAT event is booked. There is no separate fixed meeting count (the old `meetingSlots: 10` goes away).
- Booking: the recruiter requests a meeting as today; when the applicant accepts, they pick a 30-minute slot that is free for both sides.
- Several seeded events. Every role (recruiter, applicant, staff) picks an event in the prototype strip and sees only that event's data.
- Calendar is in-app only (no .ics, no external sync).

## Global constraints

- Synthetic data only. Event names and locations end in "(fictional)". Never real people.
- Human decides: booking is the applicant's explicit choice of a slot. The system never picks a slot for them, never ranks applicants.
- Times are event-local wall-clock strings: date `YYYY-MM-DD`, times `HH:MM` (24 h). No `Date` timezone maths; compute with minutes since midnight. `SLOT_MINUTES = 30` as a named constant.
- Immutability (return new objects/arrays), functions under 50 lines, early returns, no dead code.
- UI: use classes in `app/globals.css` (`page`, `h1`/`h2`, `card`, `panel`, `btn`/`btn-primary`/`btn-sm`, `field`, `notice-error`, `text-muted`, `border-line`, `bg-surface`…). Never raw `neutral-*`/`red-*` colours.
- Next.js 16 in this repo differs from training data: read `node_modules/next/dist/docs/` before using an unfamiliar API.
- Tests (Vitest, names `test_<what>_<when>_<expected>`) for domain logic and data transforms. UI needs no tests.
- `scripts/check.sh` (lint + typecheck + tests) must pass at the end of every task. Stage named files only, never `git add -A`. Conventional commits.
- Demo pair must keep working: company `company-01` (Acme Robotics Oy) and applicant `talent-017` at `event-01`.

## Task 1: Event data model, calendar domain logic and seed data

Files: `lib/domain/types.ts`, new `lib/domain/calendar.ts` + `lib/domain/calendar.test.ts`, `lib/domain/meetings.ts` + test, `lib/domain/fixtures.ts`, `data/synthetic/generate.mjs`, regenerated `data/synthetic/*/*.json`, `data/synthetic/seed.test.ts`, plus the minimal caller updates that keep typecheck green (`app/(recruiter)/recruiter/applicants/page.tsx`, `app/actions/applicantMeetings.ts`, `app/(applicant)/applicant/meetings/MeetingControls.tsx`).

Data model:
- `EventSchema`: add `location: string`, `startTime` and `endTime` (`HH:MM`, validated by regex `^([01]\d|2[0-3]):[0-5]\d$`). `endTime` must be after `startTime` (refine).
- `CompanyEventSchema`: remove `meetingSlots`. It now means only "company attends event".
- New `ApplicantEventSchema { applicantId, eventId }` and a `applicantEvents` collection in `Db`, `DbSchema`, `emptyDb`.
- `MeetingSchema`: add optional `slotStart` (`HH:MM`). A `booked` meeting always has one; a `requested` meeting has none.

`lib/domain/calendar.ts` (pure functions over `Db`):
- `SLOT_MINUTES = 30`.
- `eventSlots(event): string[]` — slot start times from `startTime` up to but excluding `endTime` (14:00–18:00 → 8 slots, "14:00" … "17:30").
- `slotEnd(slotStart): string` — "14:30" → "15:00".
- `companyCalendar(db, eventId, companyId)` and `applicantCalendar(db, eventId, applicantId)` → `{ slots: { start, end, meeting?: Meeting }[], total, booked, full }`, where `meeting` is the booked meeting in that slot.
- `sharedFreeSlots(db, meetingId): string[]` — slots of the meeting's event where neither the company nor the applicant has a booked meeting.
- `companyOpenSlots(db, eventId, companyId): number` — `total − booked − pending requests` (min 0). A company cannot request more meetings than it has slots left.

`lib/domain/meetings.ts`:
- Replace `slotsLeft` with `companyOpenSlots` (delete `slotsLeft`; update its one caller).
- `requestMeeting` additionally rejects when the company does not attend the event (`not-at-event`) or the applicant is not registered (`not-at-event`); keeps `no-slots-left` via `companyOpenSlots`.
- `acceptMeeting(db, meetingId, slotStart)` books only if `slotStart` is in `sharedFreeSlots`; errors `not-found`, `not-requested`, `slot-unavailable`. Sets `status: "booked"` and `slotStart`.

Callers (minimal, keeps main runnable; Task 3 replaces the UI properly):
- Recruiter applicants page: show "N of M meeting slots open" from `companyOpenSlots` and the event's slot total.
- `acceptMeetingAction(meetingId, slotStart)` validates `slotStart` is a string matching `HH:MM` and maps errors to plain messages.
- `MeetingControls.tsx`: accept requires a chosen slot. Minimal version: a `<select>` of `sharedFreeSlots` passed in from the page, no default selection, button disabled until chosen.

Seed data (edit `generate.mjs`, then run `node data/synthetic/generate.mjs`; keep it deterministic):
- `event-01`: keep id, name "Spring Meetup Helsinki (fictional)" → rename to "Winter Meetup Espoo (fictional)", date 2026-12-05, 14:00–18:00, location "Kaskela Hall, Espoo (fictional)". All 4 companies, all 8 applicants.
- `event-02`: "Tech Evening Otaniemi (fictional)", 2027-01-21, 16:00–19:00, location "Lantern House, Otaniemi (fictional)". Companies `company-01`, `company-03`. Applicants `talent-017` plus 3 others.
- `event-03`: "Green Industry Day (fictional)", 2027-02-11, 10:00–13:00, location "Harbour Pavilion, Espoo (fictional)". Companies `company-02`, `company-04`. 4 applicants, not `talent-017`.
- Existing signals stay on `event-01`. Seed no meetings.
- Update `seed.test.ts`: drop the `meetingSlots` check; check every event has a valid window and location, every applicantEvents/companyEvents id exists, `talent-017` and `company-01` attend `event-01`.
- `lib/domain/fixtures.ts`: give the fixture event a window and register the fixture applicant.

Tests: every function in `calendar.ts` with known inputs (slot grid for 14:00–18:00 and 10:00–13:00; full calendar; shared free slots excluding both sides' bookings; open slots counting pending requests); `acceptMeeting` with free, taken-by-company, taken-by-applicant and unknown slots; `requestMeeting` rejecting a company or applicant not at the event.

Update `docs/gap-analysis.md` row FR-C4 to say slots now come from the event's time window.

## Task 2: Event picker and event context for every role

Files: `app/components/RoleBar.tsx`, `app/actions/session.ts`, new `app/components/EventBanner.tsx`, `app/layout.tsx` (only to render the banner), `app/staff/page.tsx`, `app/(applicant)/applicant/companies/page.tsx` (only if it lacks event scoping), `lib/session.ts` only if needed. Do NOT touch meetings pages or `MeetingControls.tsx` (Task 3 owns them).

- Prototype strip: an "Event" `<select>` for every role, listing all events by name and short date, with the same form/Switch pattern as the company picker. Server action `pickEvent` sets `eventId`. If the session's company does not attend the chosen event, switch `companyId` to the first attending company; same for `applicantId` and `applicantEvents`.
- Company and applicant pickers list only those attending the session's event.
- `EventBanner`: a quiet strip under the header on every role page showing event name, formatted date (e.g. "Sat 5 Dec 2026"), "14:00–18:00", location. Format dates without timezone shifts (build from the `YYYY-MM-DD` parts). Put the date formatter in `lib/domain/eventFormat.ts` with tests.
- Staff page: list only applicants registered at the session's event.
- Applicant companies page and any other page reading `companyEvents`: confirm they scope to `session.eventId`; fix any that do not.

## Task 3: In-app calendar and slot booking UI

Files: new `app/components/EventCalendar.tsx`, `app/(applicant)/applicant/meetings/page.tsx`, `app/(applicant)/applicant/meetings/MeetingControls.tsx`, `app/(applicant)/applicant/meetings/[meetingId]/page.tsx` if it shows accept, `app/(recruiter)/recruiter/meetings/page.tsx`, `app/(recruiter)/recruiter/meetings/[meetingId]/page.tsx` (show the booked time), `app/globals.css` (append calendar classes only). Do NOT touch RoleBar, session, layout or staff (Task 2 owns them).

- `EventCalendar` (server component): heading "Your calendar for <event name>", the event's date and window, then one row per 30-minute slot from start to end: time range, and either "Open" or the booked meeting (recruiter sees the applicant's display name, applicant sees the company name), linking to the meeting page. A summary line "3 of 8 slots booked". When full: "Your calendar for this event is full. That is your maximum for this event." Use semantic tokens; a booked row uses `bg-surface`/`border-line`, an open row is quieter.
- Recruiter and applicant Meetings pages show `EventCalendar` at the top, then the existing meeting list. Each booked meeting in the list shows its time ("14:30–15:00").
- Applicant accept: replace the minimal select with a slot picker: the shared free slots as a list of radio options ("14:30–15:00"), nothing preselected, primary button "Book this time". If there are no shared free slots, show a plain notice that there is no time left that suits both calendars.
- Recruiter applicants page "Request meeting" stays; when the company has no open slots, the existing disabled state explains "Your calendar for this event is full."
