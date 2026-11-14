---
name: responsible-ai-check
description: Check an idea, feature, prompt or diff against the challenge's hard rules (human decides, no profiling or ranking of people, data minimisation, protected attributes, no emotion recognition, synthetic data, symmetry, event-start load). Use before shipping anything that touches matching, AI prompts, personal-data fields or the pitch, and when asked "is this compliant / fair / allowed".
---

# Responsible-AI check

Judges score privacy, transparency, fairness and "no automated decisions about individuals". A violation can sink the project, so run this quickly and often. Source of truth: `docs/constraints.md`.

Go through the change (`git diff`, the feature description or the prompt text) and answer each line with **OK**, **FIX**, or **N/A**:

| # | Question | FIX if… |
|---|---|---|
| 1 | Does a human make every decision about a person? | Code or a prompt ranks, scores, filters, shortlists or rejects applicants; a "top match" list or score about a person is shown to a recruiter |
| 2 | Is every AI suggestion explained and dismissible? | A suggestion has no visible reason, or no way to dismiss/override it |
| 3 | Is the applicant's content their own? | AI drafts or rewrites content instead of asking questions; edits/translations aren't labelled ("language edited", "translated from …") |
| 4 | Does every personal-data field have a stated purpose? | A new field (in a schema, form or prompt) has no purpose, or identity data is collected "just in case" |
| 5 | Are protected/proxy attributes kept out of matching? | Nationality, language of origin, age, gender, name, photo, or education institution is used as a feature, sent to a matching prompt, or shown before a meeting is booked |
| 6 | No emotion or biometric inference? | Anything analyses voice, video, face or text "confidence/personality" (EU AI Act Art. 5 bans this) |
| 7 | Synthetic data only? | Real names, emails, profiles or scraped data; demo data that could be mistaken for real; output without a seeded generator |
| 8 | Symmetric? | Talent gets AI help describing themselves but companies don't get help describing their needs (or vice versa) |
| 9 | Is the user told it's AI? | A chatbot or AI-generated text is not labelled (Art. 50) |
| 10 | Does the live part survive everyone joining at once? | Event-time pages call an LLM per request with no cache/precompute, or have no fallback |

Output: the table with verdicts, then for each FIX the file:line and the smallest concrete change. If the fix changes the concept, flag it for the team instead of applying it. Don't lecture; one line per item.
