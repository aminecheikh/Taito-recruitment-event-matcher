# Stitch Brief — visual directions

Paste everything inside the box into Google Stitch (stitch.withgoogle.com). Ask for **3 different visual directions**. Before anyone builds from a result, check it against the "Never include" list and run skill `responsible-ai-check`.

---

```
Design a web app (desktop + phone) for recruitment matchmaking events run by a city's
employment services. Product name: not decided — show "[Product]" as a placeholder.
Do not use any real city or company logo or branding.

THE IDEA
No CVs, no job ads. Recruiters pick 1–5 "core requirements" they really hire on.
Applicants write short real stories in their own words; AI only asks follow-up
questions and suggests which requirement a story could be evidence for — the applicant
accepts or rejects each suggestion. Recruiters see anonymous evidence cards, request
meetings, meet for 15 minutes, and both sides decide "continue or not".

TONE
Calm, plain, trustworthy public-service tool. Generous whitespace, strong readable
typography, high contrast (WCAG AA), large tap targets. Nordic and understated.
Human, not corporate. Light and dark mode.

THREE ROLES, SWITCHED FROM A TOP BAR: Recruiter · Applicant · Event staff

APPLICANT SCREENS
1. My stories — list of the applicant's stories + editor. Side panel "AI question":
   exactly one follow-up question at a time (e.g. "What did you do yourself, and what
   changed afterwards?"), clearly labelled as AI. Buttons "Fix language" and
   "Translate" show a before/after comparison; once accepted, the story shows a small
   label "language edited" or "translated from Ukrainian".
2. Companies — each company shows its 1–5 core requirements, each with one line
   "what it looks like in practice". For a selected story: "AI suggestion: this could
   be evidence for #1 — because you wrote '…'" with Accept / Reject / Move buttons.
   A gaps view per company: "no example yet".
3. Signals — "You have 3 signals for this event". Signal a company you really want
   to meet. Needs at least 1 accepted example for that company.
4. My meetings — the shared meeting card (see below), then the decision
   "Continue / Not this time", then the result.

RECRUITER SCREENS
1. Core requirements — paste an old job ad, see an extracted list, drag to rank,
   mark at most 5 as core, add one "in practice" line each.
2. Who signalled us — anonymous evidence cards ("Applicant 017"). Every core
   requirement is a slot showing the applicant's example or "no example yet". Filter:
   "covers all", "at least 3", … Counter "7 of 10 meeting slots left".
   Score input 0–10 per requirement, entered by the recruiter. "Request meeting".
3. Meeting card — core requirements on the left, the applicant's examples on the right.
4. After the meeting — score 0–10 per requirement, "Continue / Not this time",
   feedback line per requirement if not; if it's a match: contact person, next step,
   timeline.

EVENT STAFF SCREEN
"Who might need help": applicants with no stories or no accepted examples, listed
alphabetically, with an "Offer coaching session" button. No scores.

NEVER INCLUDE
- Match percentages, "92% match" badges, compatibility meters, star ratings
- Any ranking or score of applicants produced by AI
- Applicant photos, names, age, nationality or school on recruiter screens before a
  meeting is booked
- Chatbot avatars pretending to be human
- Purple/indigo gradients, glassmorphism, icon-in-coloured-circle feature grids,
  emoji as decoration, stock photos

Use only obviously fictional data (e.g. "Acme Robotics Oy (fictional)",
"Applicant 017").
```

---

## After Stitch

1. Screenshot the 3 directions into `docs/design/` (e.g. `direction-a.png`).
2. Team picks one; record it with skill `decide`.
3. Turn the chosen palette and type into Tailwind theme tokens in the app.
