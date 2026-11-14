# 01 - Existing approaches and products

Research date: 2026-11-14. Method: web search plus page fetches. Vendor sources are marked as such. Anything not opened or only seen in a search snippet is marked *(unverified)*. Not covered (no usable sources found): Denmark, Sweden, Netherlands, Estonia PES matchmaking events, Applied, Textio's own methodology page, Brella/Tavata/Grip internals. These are open gaps, not negative findings.

## 1. Key takeaways

1. **Espoo already runs the closest thing to our concept.** TalentMatch: 200-1,000 jobseekers and 5-50 employers per event, 1:1 15-minute intros, pre-screened profiles, "meetings only when both sides show interest". Its public page reports no hiring outcomes, only intended benefits. Our concept should extend this existing format, not replace it.
2. **Event-matching platforms match on declared profile text, and their own vendors admit thin profiles give irrelevant matches.** The input (what each side says) is the weak link, not the algorithm.
3. **Randomised job-fair evidence says fairs mostly correct beliefs, not hire volume.** In an Ethiopian experiment, firms said they wanted tertiary graduates but offers went mostly to secondary graduates. Both sides revised over-optimistic expectations. This supports "tell us your real 4 core needs".
4. **Dropping requirements on paper does not change hiring.** Harvard Business School / Burning Glass (2024): about 45% of firms changed ads "in name only"; the average rise in non-degree hires was 3.5 points. Company-declared requirements need a forcing mechanism (ranking to a top 4), not just a rewritten ad.
5. **Structured interviews beat unstructured ones.** Sackett et al. re-analysis reports validity of about 0.42 vs 0.19 *(figures from secondary commentary, unverified against the paper)*. Structuring the event conversation around 4 shared criteria is evidence-aligned.
6. **AI on both sides is degrading CV signal.** Robert Half (Nov 2025, staffing-firm survey, secondary coverage): 67% of HR leaders say AI-generated applications slowed hiring; 65% say verifying skills got harder. Experts expect a move toward practical tests and in-person interviews.
7. **Public tools suggest, humans decide, but vocabulary mismatch remains.** Työmarkkinatori's recommender only suggests keywords and states that jobseekers and employers describe skills in different words. Nobody fixes that with the jobseeker's own evidence.
8. **No controlled evidence exists that AI mock-interview tools improve strength articulation** (only vendor pages found). Our "AI asks, never writes" design cannot lean on published proof.

## 2. Findings

### 2.1 Event matchmaking platforms

- **Brella.** Attendees declare interests and intents at onboarding; the algorithm matches on these; organisers can view matches per attendee. Public docs do not detail the algorithm, and no independent complaints were found. Sources: Brella help centre, "Introduction" (https://help-organizers.brella.io/en/articles/177659-introduction); Brella, "Best Practices for Matchmaking" (https://help.brella.io/en/organizers/best-practices-for-matchmaking).
- **Swapcard / Grip / b2match.** Vendor claims: Grip case with Clarion Events, +44% in-person meetings; Swapcard says AI doubles match acceptance; 65-75% of meeting requests unanswered without AI help *(vendor stat, uncited, unverified)*. Swapcard added a "mark recommendation as irrelevant" control, implying irrelevance was a real problem (https://release-iframe.swapcard.com/marking-proposed-recommendations-as-irrelevant-47hr8Y). Source: Converve (competitor vendor), "AI Matchmaking at Events: How It Works and When It Doesn't" (https://converve.com/event-networking-blog/ai-matchmaking-at-events-how-it-works), fetched.
- **Stated failure modes (same Converve source, vendor bias noted):** thin profiles produce thin matches; late registrants have sparse profiles (cold start); algorithms see similarity, not commitments; at events under about 150 people an organiser who knows participants beats full automation.
- **Tavata:** not researched; no source found *(unverified)*.

### 2.2 Espoo and Finnish public services

- **Espoo TalentMatch** (City of Espoo / Business Espoo, with TE-Live.fi per Duunitori): free, English-language, online or in person, hybrid in 2024; booths, keynotes, webinars, optional pitching; "profiles are pre-screened, meetings occur only when both sides show interest"; 15-minute intros; 200-1,000 jobseekers and 5-50 employers per event. No outcome data published. Sources: https://www.espoo.fi/en/talentmatch-recruitment-event (fetched); https://workinfinland.com/en/events-talent/talentmatch-recruitment-events-2024 (search result; events hub page fetched showed 0 events); https://duunitori.fi/tyoelama/talentmatch-espoo-recruitment-event (search result only). The 28 March 2025 edition advertised 300+ professionals plus an HR meetup and pitching (https://workinfinland.com/en/tyonantajat/tapahtumat/espoo-talentmatch-3-2025, search result).
- **Espoo "Employer Speed Dating"** exists as a service page (https://www.espoo.fi/en/employer-speed-dating) but the page returned 404 when fetched; format *(unverified)*.
- **Business Espoo** offers recruitment assistance and international-talent specialists, support applying for recruitment subsidies and company language training (https://www.espoo.fi/en/business-espoo-helping-companies-thrive/recruitment-assistance-0, search result). Talent Boost is the national programme coordinated by two ministries; Talent Espoo is the local implementation (search results, valtioneuvosto.fi and espoo.fi).
- **Työmarkkinatori (Job Market Finland).** Matching runs several scoring algorithms (keywords, languages, licences, text similarity) and sums points; vocabulary is FINESCO (based on ESCO). The recommender only suggests keywords, the user decides. Stated limits: cannot capture special requirements not in data; seekers and employers use different words; matching returns options, not one right answer. Source: Työmarkkinatori, "Kohtaanto ja osaamissuosittelija" (https://tyomarkkinatori.fi/tietoa-palvelusta/tietoa-tyomarkkinatorista/kohtaanto-ja-osaamissuosittelija-tyomarkkinatorilla), fetched. Gofore blog (2020) notes terminology mismatch, e.g. "bus driver" returning "taxi driver" (https://gofore.com/en/the-good-algorithm-an-ai-solution-designed-to-do-good/, search result). No independent accuracy audit found.
- **TE services to municipalities reform 2025; Helsinki/Vantaa programmes:** not researched *(unverified)*.

### 2.3 Event formats that change match quality

- **Randomised job fair (Ethiopia).** Fafchamps, Abebe, Caria, Falco, Franklin, Quinn, Shilpi, "Matching Frictions and Distorted Beliefs: Evidence from a Job Fair Experiment", J-PAL/CEPR WP, Dec 2023 (https://povertyactionlab.org/media/file-research-paper/matching-frictions-and-distorted-beliefs-evidence-job-fair-experiment). I only saw the landing page; findings below come from search-result summaries *(unverified against the PDF)*: few direct hires; both sides corrected over-optimistic beliefs; in an earlier version, 105 interviews led to 14 offers; Gale-Shapley recommendations were used. Context is a developing country, so transfer to Espoo is limited.
- **Speed interviewing for students** (5-minute interviews with multiple employers), Emerald, *Education + Training* (https://emerald.com/insight/content/doi/10.1108/ET-04-2021-0145/full/html), search result only; outcomes not seen.
- **Reverse job fairs, work trials, hackathon-style recruiting:** no evaluative source found; treat as practitioner claims only *(unverified)*.
- **Germany Job-Turbo** (not an event): caseworker contact every ~6 weeks roughly doubled exit-to-job for Ukrainian refugees; no displacement of others found. PNAS 2026, 123(14), via https://immigrationlab.org/?p=5860 and IAB page (search results). Suggests sustained human contact outperforms one-off matching, but it is a different intervention.

### 2.4 Skills-based hiring, credentials, blind and structured methods

- **HBS / Burning Glass Institute, report on skills-based hiring (Feb 2024; title "The Emerging Degree Reset" from memory, *unverified*)**, as reported: 11,300 roles; 37% of firms are genuine leaders, about 45% "in name only", the rest backslid; leaders' non-degree hires retain 10 points better. I did not open the report; coverage via https://pw.hks.harvard.edu/post/skills-based-hiring-the-long-road-from-pronouncements-to-practice and CNBC mirrors.
- **Europass / European Digital Credentials.** Commission evaluation 2018-2022 reports uneven uptake (EDC tool about 28% *(unverified, from search snippet)*); Cedefop finds issuing and storing mature, sharing and verification weak, interoperability and employer trust as obstacles. Sources: https://www.eumonitor.eu/9353000/1/j4nvhdfdk3hydzq_j9vvik7m1c3gyxp/vmbv6txmh8zr; https://www.cedefop.europa.eu/en/projects/digital-tools-portability-learning-outcomes (search results). Open Badges cannot be stored directly in the Europass wallet per a 2025 paper (https://www.scitepress.org/publishedPapers/2025/134822/pdf/index.html). Verified credentials certify what was formally learned, not how a person tells their story.
- **GapJumpers.** Blind auditions: candidates do work tasks, are ranked by algorithm, identities revealed after shortlisting (https://onrec.com/news/news-archive/is-the-future-of-hiring-blind, search result). Only anecdotal outcomes; no independent data. **Applied:** nothing found.
- **Structured interviews.** Sackett, Zhang, Berry, Lievens (2022, *J. Applied Psychology*) re-analysis; commentary reports 0.42 structured vs 0.19 unstructured, with wide credibility intervals (https://www.master-hr.com/insights/insights-from-sackett-et-al-2023/; https://www.noon.ai/blog/articles/356-structured-interview-validity, search results; original not opened).

### 2.5 Job-ad and candidate-articulation tools

- **Textio** scores ads by whether language shifts who applies; its own studies (vendor) show gendered language effects (https://textio.com/blog/language-in-your-job-post-predicts-the-gender-of-your-hire, search result). An academic analysis of 17M LinkedIn listings (calibrated against Textio and Unitive) found listing gender bias fell over ten years (https://www.cs.uchicago.edu/~ravenben/publications/pdf/gender-cscw18.pdf, search result). These tools polish wording; none force prioritisation of requirements. The "women apply only at 100% match" claim traces to an unlocated HP source *(unverified)*.
- **AI interview coaches** (STAR-method tools, mock interviewers): vendor pages describe vague-answer probing and model-answer suggestions; no independent effectiveness study found. A University of Toronto student report (RateMyInterview) is the only academic item, not an effectiveness study (https://www.eecg.utoronto.ca/~jayar/1786_24_projects/reports/ratemyinterview.pdf, search result).

### 2.6 AI-on-AI hiring and regulation

- Robert Half survey (Nov 2025, >2,000 US hiring managers) as covered by People Matters: 67% slower hiring, 65% harder verification (https://www.peoplematters.in/news/ai-and-emerging-tech/67percent-of-hr-leaders-say-ai-generated-resumes-are-slowing-the-hiring-process-48742). Greenhouse 2025 via Deel: 74% of US jobseekers use AI, nearly half to pass filters *(secondary, unverified)*. Louis Hickman (Virginia Tech) calls it an "arms race" that "is not working for either side" (https://virginiabusiness.com/ai-reshapes-hiring-virginia-resume-interview-challenges/, search result). All US data.
- **EU AI Act:** Annex III point 4 classifies recruitment and selection AI as high-risk; Article 14 requires effective human oversight; emotion recognition in workplace/hiring contexts has been prohibited since 2 Feb 2025 (secondary sources: https://artificialintelligenceact.eu/what-the-act-means-for-staffing-businesses/, https://pin.com/blog/eu-ai-act-recruiting). One source says the Digital Omnibus moved Annex III duties to 2 Dec 2027 vs 2 Aug 2026; **unresolved, check Regulation (EU) 2024/1689 and Commission updates.**

### 2.7 What failed, and why (evidence-limited)

- Profile-based matching fails when profiles are shallow or late (Converve, Brella best-practice pages).
- Fairs produce few hires when employer expectations are unrealistic (Fafchamps et al.).
- Formal skills tools stall at the sharing/verification and employer-trust stage (Cedefop).
- Degree-requirement removal reverts without process change (HBS/BGI).
- Generated applications make every written signal noisier (Robert Half).
- I found no primary evidence on company engagement failure or "overload of irrelevant approaches" in Finnish events; the team's challenge brief is the only source for those.

## 3. Gaps nobody fills well

1. **Forcing employers to prioritise.** Ad tools rewrite wording; matching platforms take whatever is declared. Nothing found asks a recruiter to rank requirements down to about four before the event.
2. **Jobseeker evidence in their own words, produced under constraint.** Coaches draft or polish answers; credentials certify learning. Nothing found that makes a jobseeker produce concrete examples mapped to named employer criteria, with AI limited to questions.
3. **A shared conversation script.** TalentMatch gives 15-minute slots but no published structure. Structured-interview evidence is not applied to fair conversations.
4. **Jobseeker-side self-selection.** Matching is typically algorithm- or organiser-driven; mutual interest is gated but based on profile text.
5. **Late employer input.** Platforms rely on profiles built near the event (cold start). No tool ties employer input to a deadline that organisers can act on.
6. **Outcome measurement.** TalentMatch and platforms publish activity, not matches that turned into hires or interviews.

## 4. So what for our design

**Copy**
- TalentMatch's mutual-interest gating, 15-minute 1:1 slots, and hybrid format. Build as a layer on top, with Business Espoo as the organiser user.
- Työmarkkinatori's "suggest, user decides" pattern and ESCO/FINESCO vocabulary for optional skill tagging, which also aids interoperability.
- Structured-interview logic: same 4 criteria, same prompts, notes per criterion.
- Blind-audition idea of evidence before identity, applied only to the preparation step.
- Swapcard's "mark as irrelevant" feedback control, to capture mismatch signals.

**Avoid**
- Ranking or scoring individuals by algorithm. Recruitment is high-risk under the AI Act; keep any ranking on the employer-requirements side and any selection human. Do not infer emotion or traits from voice or video.
- Letting AI draft jobseeker content: it recreates the synthetic-CV problem and sits badly with human-oversight duties.
- Long profile forms. Thin or late profiles are the main documented matching failure; keep the top 4 and 4 examples as the whole profile.
- Relying on credentials or badges as the core signal; adoption and employer trust are weak.
- Claiming match-quality gains without a measurement plan. Propose outcome metrics (interviews held, follow-ups requested by both sides) since the field lacks them.

**Design implications**
- Set an employer deadline well before the event and show organisers a completeness view.
- Make the top-4 forced ranking the single employer input; allow "nice-to-haves" in a separate field the organiser can ignore.
- Provide a facilitation card for the event conversation: 4 criteria, one example prompt each, plus a note-taking field per criterion.
- Support international jobseekers and career changers with question prompts in plain language (and multilingual input), since the cited problem is articulation, not capability.

## 5. Sources (opened = fetched; otherwise search result only)

- City of Espoo, TalentMatch recruitment events. https://www.espoo.fi/en/talentmatch-recruitment-event (opened)
- Työmarkkinatori, Kohtaanto ja osaamissuosittelija. https://tyomarkkinatori.fi/tietoa-palvelusta/tietoa-tyomarkkinatorista/kohtaanto-ja-osaamissuosittelija-tyomarkkinatorilla (opened)
- Converve, AI Matchmaking at Events (vendor). https://converve.com/event-networking-blog/ai-matchmaking-at-events-how-it-works (opened)
- Work in Finland, TalentMatch 2024 hub. https://workinfinland.com/en/events-talent/talentmatch-recruitment-events-2024 (opened, 0 events listed)
- Fafchamps et al. 2023, job fair experiment (landing page opened). https://povertyactionlab.org/media/file-research-paper/matching-frictions-and-distorted-beliefs-evidence-job-fair-experiment
- Brella help centre. https://help-organizers.brella.io/en/articles/177659-introduction ; https://help.brella.io/en/organizers/best-practices-for-matchmaking
- Swapcard product update. https://release-iframe.swapcard.com/marking-proposed-recommendations-as-irrelevant-47hr8Y
- Gofore, The good algorithm (2020). https://gofore.com/en/the-good-algorithm-an-ai-solution-designed-to-do-good/
- Espoo recruitment assistance. https://www.espoo.fi/en/business-espoo-helping-companies-thrive/recruitment-assistance-0
- Duunitori, Talent Espoo. https://duunitori.fi/tyoelama/talentmatch-espoo-recruitment-event
- Work in Finland, Espoo TalentMatch 2025. https://workinfinland.com/en/tyonantajat/tapahtumat/espoo-talentmatch-3-2025
- Emerald, student-employer speed events. https://emerald.com/insight/content/doi/10.1108/ET-04-2021-0145/full/html
- Immigration Policy Lab / IAB, Germany Job-Turbo. https://immigrationlab.org/?p=5860
- Fuller (HKS), skills-based hiring. https://pw.hks.harvard.edu/post/skills-based-hiring-the-long-road-from-pronouncements-to-practice
- EU Commission explanatory memorandum COM(2024)135 (Europass). https://www.eumonitor.eu/9353000/1/j4nvhdfdk3hydzq_j9vvik7m1c3gyxp/vmbv6txmh8zr
- Cedefop, digital tools portability. https://www.cedefop.europa.eu/en/projects/digital-tools-portability-learning-outcomes
- SciTePress 2025, EDC in non-formal settings. https://www.scitepress.org/publishedPapers/2025/134822/pdf/index.html
- OnRec, Is the future of hiring blind (GapJumpers). https://onrec.com/news/news-archive/is-the-future-of-hiring-blind
- Master-HR on Sackett et al. https://www.master-hr.com/insights/insights-from-sackett-et-al-2023/ ; Noon. https://www.noon.ai/blog/articles/356-structured-interview-validity
- Textio blog. https://textio.com/blog/language-in-your-job-post-predicts-the-gender-of-your-hire ; UChicago CSCW 2018. https://www.cs.uchicago.edu/~ravenben/publications/pdf/gender-cscw18.pdf
- People Matters on Robert Half survey. https://www.peoplematters.in/news/ai-and-emerging-tech/67percent-of-hr-leaders-say-ai-generated-resumes-are-slowing-the-hiring-process-48742
- Virginia Business, AI reshapes hiring. https://virginiabusiness.com/ai-reshapes-hiring-virginia-resume-interview-challenges/
- artificialintelligenceact.eu, staffing businesses. https://artificialintelligenceact.eu/what-the-act-means-for-staffing-businesses/ ; Pin blog. https://pin.com/blog/eu-ai-act-recruiting
