---
name: synthetic-data
description: Create or extend fictional demo data (companies, recruiter top-4s, talent evidence cards, events) reproducibly under data/synthetic/. Use when the app needs seed data, personas or test fixtures, or when asked to "generate data", "add personas", "seed the demo".
---

# Synthetic data

Rules: `data/synthetic/README.md`. Never fetch, scrape or paraphrase data about real people or real companies' internal data.

1. **Schema first.** Reuse the schema the app already reads (check `data/synthetic/` and the code's types). If none exists yet, propose a minimal one in the README layout (`companies/`, `talent/`, `events/`) and give every personal field a purpose (data minimisation).
2. **Generator, not hand-typed output.** Write a script next to the data, e.g. `data/synthetic/generate.py` or `generate.mjs`, with a **fixed seed** at the top. Commit script + output together (`data: …` commit). Keep output small (< 1 MB); the demo needs a few dozen records, not thousands.
3. **Obviously fictional.** IDs like `talent-017`, `company-04`; company names end in `(fictional)`; emails only on reserved domains (`talent-017@example.org`). The pre-commit hook blocks other email domains in `data/`.
4. **Built-in diversity the system must handle fairly:** non-Finnish names and languages, career changers, caregiving gaps, non-traditional education, foreign credentials, people whose best example comes from volunteering or a family business.
5. **Demo personas.** Include 3–5 hand-picked, named-by-role personas that tell the pitch story (e.g. `talent-003`: career changer with a strong volunteering example; `company-02`: recruiter whose job ad is a 12-item wishlist). Document them in `data/synthetic/README.md`.
6. **LLM-generated text** (evidence cards, job ads): commit the prompt used alongside the output, and review a sample for accidental real names or companies.
