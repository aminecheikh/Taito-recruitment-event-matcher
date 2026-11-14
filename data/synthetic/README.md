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
  companies/       fictional company needs / role descriptions
  talent/          fictional jobseeker profiles
  events/          fictional event setups (format, date, participants)
```

Create subfolders as needed once the team has picked an idea and a schema.
