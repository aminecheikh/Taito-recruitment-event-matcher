# Pitch outline

Every number below is from `docs/research/README.md` and the linked reports. Figures the research flags as unverified are marked. Nothing here is new.

## 1. Problem (AI on both sides)

- Both sides now use AI. Written material has lost signal: after LLMs arrived, a well-written proposal stopped predicting who got hired (Galdin and Silbert 2025, working paper, not peer reviewed).
- LLM screeners prefer AI-written resumes 67 to 82 percent of the time (Xu et al., AIES 2025).
- Pain points: #2 companies struggle to describe their needs clearly and early, #5 professionals find it hard to describe their competencies and transferable skills, #6 AI-written CVs analysed by AI screeners, so matching happens on synthetic representations.
- Employers' stated requirements are not their real ones: about 45 percent of firms dropped degree requirements "in name only" (HBS and Burning Glass 2024, secondary source).

## 2. The idea: no CV, no job ad

- Recruiters commit to 1 to 5 core requirements, ranked, one line each on what it looks like in practice.
- Applicants show one real example per requirement, in their own words.
- Names hidden until a meeting is booked. The CV comes after the conversation, if both sides want it.
- Builds on Espoo's TalentMatch (200 to 1,000 jobseekers, 5 to 50 employers, 15-minute 1:1 intros), not a replacement.

## 3. Demo (about 6 minutes)

See `docs/demo/demo-script.md`. Applicant 017 and Acme Robotics Oy (fictional).

## What sets us apart

- The AI refuses to judge people, right where you type (paste "Rank the applicants" into the job-ad box and it says no).
- Both sides get help describing themselves: applicants with stories and a CV head start, companies with job-ad extraction and recruiter questions.
- Scores are human, weighted by the recruiter's own ranking, and nobody gets filtered out unread (unscored applicants stay visible).
- International needs are revealed only after a match, and only if the applicant opted in.
- Privacy you can click: a field table with purposes, Download my data, Delete all my data.

## 4. Human decides: EU AI Act and GDPR story

- Recruitment is high risk (Annex III, point 4(a)). Profiling would keep it high risk.
- Our design keeps AI away from judging people: it asks recall questions, suggests story-to-requirement links with a visible reason, and fixes or translates language with a label. It never scores, ranks or filters.
- Every decision about a person is human: the recruiter scores and chooses, each side answers continue or not, a match needs both.
- "A human clicks approve" is not oversight (people followed a biased AI's picks about 90 percent of the time under severe bias, UW 2025, from a press release). So the AI is not in the choosing step at all.
- Real deployment would need: risk management (Art. 9), data governance (Art. 10), logging (Art. 11 and 12), transparency (Art. 13), human oversight (Art. 14), a DPIA (GDPR Art. 35) and a fundamental rights impact assessment for a public body (Art. 27). Art. 22 right not to be subject to solely automated decisions. Say the AI Act Annex III application date is reported as both 2 Aug 2026 and 2 Dec 2027, check the official text.
- No emotion recognition (Art. 5(1)(f)). AI content is labelled (Art. 50). Data minimisation: no photo, age, gender, nationality or institution as a feature.
- Known MVP limit to state: language labels are enforced in the UI. A real deployment would use a signed one-time token verified on save.

## 5. Evidence

- Structured interviews predict performance roughly twice as well as unstructured ones, about .42 versus .19 (Sackett et al. 2022). *(figures from secondary commentary, unverified against the paper)*
- Impression management correlates r = .47 with interview ratings but r = .15 with job performance (Barrick et al. 2009, figures as cited by later work).
- A small, fixed number of interest signals makes each one informative (Coles, Kushnir and Niederle 2013; Lee and Niederle 2015).
- Name discrimination is documented in Finland (Ahmad 2020). Accent lowers perceived competence for identical content (2024 meta-analysis). Names are hidden, written examples sit next to the conversation.
- Do not quote the "women apply at 100 percent" statistic. The research says it is not evidenced.

## 6. What is open

- Screening at volume is decided: a weighted score (see `docs/pipeline.md`). Open: how the recruiter reads a 0 to 10 scale the same way every time (a scoring guide).
- Number of signals per applicant, meeting slots per company, whether the applicant sees scores or only feedback lines.
- Pain point #5 beyond examples: value proposition and getting attention.
- No published TalentMatch outcomes exist, so we cannot claim an improvement yet.

## In a real deployment

Cut from the pre-freeze build: cut-off dates (FR-C5), ESCO mapping (FR-C6), voice input (FR-T7), event-day precompute and caching (FR-E3), online meeting links (FR-E4), an accessibility audit, a UI in more languages.

## 7. Next steps with Espoo

- Pilot as a layer on TalentMatch with Business Espoo as the organiser. Questions for mentors: what outcomes TalentMatch tracks, how early companies can commit requirements, why companies say no.
- Small evaluation: recruiter-rated clarity of examples, meetings that lead to a second conversation.
- Data retention (proposal): delete event data not carried into a match after a fixed window, for example 30 days; applicants can export or delete their library at any time.
- Staff role: offer coaching to applicants who are stuck. Staff never see scores.
