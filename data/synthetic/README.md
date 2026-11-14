# Synthetic Data

All data in this repo must be synthetic. This is a challenge rule, not a preference.

## Rules

- No real people. No names, emails, phone numbers, photos or profiles copied from real sources — not even "anonymised" ones.
- No real companies' internal data. Public company facts (industry, size range) are fine if needed; invented companies are better.
- Names and contact details that look plausible must be obviously fictional (e.g. `talent-017`, `Acme Robotics Oy (fictional)`) so nobody mistakes demo data for real records.
- Deliberately include diversity the system must handle fairly: non-Finnish names and languages, career changers, non-traditional education, gaps in employment, foreign credentials.
- Generation must be reproducible: commit the generator script (with a fixed seed) or the prompt used, alongside the output.

## Layout

```
data/synthetic/
  README.md        this file
  generate.mjs     seeded generator (SEED constant at top); `node data/synthetic/generate.mjs` rewrites the three JSON files
  seed.test.ts     Vitest: merged files parse with DbSchema, plus persona invariants
  companies/companies.json   { companies, requirements }
  talent/talent.json         { applicants, stories, links, signals }
  events/events.json         { events, companyEvents }
```

Other `Db` arrays (meetings, decisions, shares, scores) start empty. Types: `lib/domain/types.ts`.

## Schema

| File | Collection | Fields |
|------|-----------|--------|
| companies | companies | id `company-NN`, name (ends `(fictional)`), sector, sizeRange |
| companies | requirements | id `req-NN-n`, companyId, text, inPractice, rank (1-based, core first), isCore (1-5 per company) |
| talent | applicants | id `talent-0xx`, pseudonym `Applicant 0xx`, displayName (fictional), contact.email `@example.org` |
| talent | stories | id `story-0xx-n`, applicantId, title, body, languageLabel (optional) |
| talent | links | id `link-NNN`, storyId, requirementId, origin, aiReason (ai-suggested only), status |
| talent | signals | eventId, applicantId, companyId |
| events | events | id `event-01`, name, date, signalsPerApplicant 3 |
| events | companyEvents | companyId, eventId, meetingSlots 10 |

## Demo personas

| Id | Role in the pitch |
|----|-------------------|
| `talent-017` | Demo applicant. Bus depot IT support; ticket-reader story. No links and no signals: the demo creates them live. |
| `company-01` Acme Robotics Oy (fictional) | Demo recruiter. Core top 4: debugging embedded systems, explaining technology, working with suppliers, Python. Five signalling applicants with mixed coverage: `talent-005` covers 4, `talent-003` and `talent-026` cover 3, `talent-009` covers 2, `talent-014` covers 1. |
| `company-02` Kestrel Logistics Ab (fictional) | Ten-item wishlist (5 core + 5 more) to show the 5-core pushback. |
| `talent-003` | Career changer (nurse to developer), strongest example is volunteering. |
| `talent-005` | International, foreign credentials. |
| `talent-009` | Non-traditional education, self-taught. |
| `talent-011` | Caregiving gap; signals Birchline Care Services. |
| `talent-014` | Family business example. |
| `talent-021` | International student; stories labelled `translated from Arabic`. |
| `talent-026` | Former conscript technician turned career changer; stories labelled `language edited`. |
