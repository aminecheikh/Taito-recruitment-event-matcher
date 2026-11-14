# 06 - Academic research on matching, markets and matchmaking events

Method note: all findings below come from web search results (abstracts, working-paper pages, summaries). I did not read full texts. Effect sizes beyond those quoted in abstracts are *(unverified)*. Where a claim is my inference rather than a paper's finding, it is labelled "inference".

## 1. Key takeaways

1. **Capped, scarce signals cut congestion.** Market-design theory and practice (Coles, Kushnir & Niederle 2013; the AEA two-signal service) show that when each applicant has a small fixed number of signals of interest, the signals carry real information and the "spray and pray" problem shrinks. This maps directly to "companies get overwhelmed by irrelevant approaches".
2. **Signals work in the field, especially for the less-obvious candidate.** In the Korean online-dating experiment (Lee & Niederle 2015), a limited "rose" raised acceptance, mainly for offers sent to recipients more desirable than the sender. Analogue: a capped, visible "I chose you" token helps non-obvious applicants (career changers, internationals) get a conversation.
3. **Job fairs produce meetings, not necessarily matches, because expectations are wrong.** The Ethiopia job fair RCT (Abebe et al., Economic Journal 2025) found many meetings, few hires, and distorted beliefs on both sides about wages, requirements and applicant quality. Fixing information before the event is the lever, which supports collecting the top-4 requirements early.
4. **Cheap, targeted information helps most those at risk.** Brochures (Altmann et al. 2018), online occupation advice (Belot, Kircher & Muller 2019) and recommendations (Le Barbanchon, Hensvik & Rathelot) help most jobseekers who search narrowly or face long unemployment. This is relevant to career changers and internationals.
5. **Naive recommenders can create congestion.** Work on reciprocal and job recommenders (Chen, Hsieh & Lin 2019; ReCon; RecSysHR 2025) says that recommending the "most popular" targets concentrates attention. Any match suggestion we make should be capped and diversified. A Swedish field experiment reportedly found limited congestion in practice, so the effect is context-dependent.
6. **The Austrian AMS algorithm is the cautionary tale.** Profiling jobseekers into A/B/C groups drew criticism for misclassification and gender disparities, and a data-protection authority reportedly banned it in 2020 for lack of a legal basis (current legal status unverified). Our "no automated decisions about individuals" rule is well-founded.
7. **Skills taxonomies widen reach but are imperfect.** ESCO-based matching is argued to give finer granularity than occupation codes, but ESCO coverage of real job-ad skills can be thin, and skills-based models can propagate gender segregation. I found no head-to-head outcome study. Use a taxonomy as a vocabulary, not as a scorer.
8. **Centralised, scheduled clearing beats ad hoc decentralised offers.** Roth & Xing (1997) show bottlenecks arise when matching is decentralised and sequential. For a one-day event, pre-scheduled slots are the analogue (inference).

## 2. Annotated bibliography

### A. Signalling and congestion in matching markets

**Coles, P., Kushnir, A., Niederle, M. (2013).** "Preference Signaling in Matching Markets." *American Economic Journal: Microeconomics* 5(2): 99-134. DOI 10.1257/mic.5.2.99. (NBER WP 16185.) https://econpapers.repec.org/RePEc:aea:aejmic:v:5:y:2013:i:2:p:99-134
Theory paper. Introducing a signalling mechanism increases worker welfare and the number of matches; firm welfare effect is ambiguous; the mechanism adds most value in balanced markets. Cheap talk is not credible, so signals must be costly or capped.
*Relevance:* Core justification for limiting how many companies an applicant can "flag". Caveat: firm welfare gains are ambiguous, so firms need something back (pre-read top-4 answers).

**Coles, P., Cawley, J., Levine, P., Niederle, M., Roth, A., Siegfried, J. (2010).** "The Job Market for New Economists: A Market Design Perspective." *Journal of Economic Perspectives* 24(4). (Described via search excerpts of the AEA signalling guidance; full article not opened.) https://ftp.aeaweb.org/joe/signal/signaling.pdf
The AEA service lets each candidate send at most two signals to departments before interviews; because of the cap, a missing signal carries almost no negative information, and the AEA says signals should not be read as "top two". Early evidence reportedly showed it was effective and non-disruptive; over half of candidates used it in each early year.
*Relevance:* A real deployed precedent of "N tokens per applicant". Note the design choice that no signal is not penalised.

**Lee, S., Niederle, M. (2015).** "Propose with a Rose? Signaling in Internet Dating Markets." *Experimental Economics* 18(4): 731-755. (NBER WP 17340.) https://www.nber.org/papers/w17340 ; https://econpapers.repec.org/RePEc:kap:expeco:v:18:y:2015:i:4:p:731-755
Field experiment, South Korean dating service, 613 participants; each could send up to ten proposals with at most one virtual rose. Roses raised acceptance, mostly for recipients more desirable than the sender, and increased total dates rather than displacing unsignalled offers. Many users did not use all their roses.
*Relevance:* Evidence that a scarce token is read as genuine interest. The under-use finding means we should prompt applicants to use signals and explain how.

**Roth, A.E., Xing, X. (1997).** "Turnaround Time and Bottlenecks in Market Clearing: Decentralized Matching in the Market for Clinical Psychologists." *Journal of Political Economy* 105(2): 284-329. https://web.stanford.edu/~alroth/papers/RothXingJPE97.pdf
In decentralised markets, the time to process an offer and rejection creates bottlenecks, and agents must weigh acceptance probability, not only preference. The psychology market later moved to centralised matching (per course slides).
*Relevance:* Why unstructured mingling creates congestion; supports pre-scheduling. Event is not a formal offer market, so apply by analogy only.

### B. Reciprocal and two-sided recommendation

**Pizzato, L., Rej, T., Chung, T., Koprinska, I., Kay, J. (2010).** "RECON: a reciprocal recommender for online dating." *RecSys 2010*, pp. 207-214. https://dblp.org/rec/conf/recsys/PizzatoRCKK10
Defines reciprocal recommendation as a distinct problem (applications named: job, mentor, business partner, date) and models both sides' preferences. Only abstract-level details seen.
*Relevance:* Frames our problem as reciprocal. We choose human-set preferences (top 4 and self-selection) over learned ones.

**Palomares, I., Porcel, C., Pizzato, L., Guy, I., Herrera-Viedma, E. (2020).** Survey on reciprocal recommender systems. arXiv. https://arxiv.org/abs/2007.16120v1 *(title and venue details unverified beyond the listing)*
*Relevance:* Entry point for the literature.

**Chen, Hsieh, Lin (2019).** Economics paper on congestion in two-sided markets with ML recommenders (full citation unverified; found as https://webarchive.ucr.edu/economics.ucr.edu/wp-content/uploads/2019/10/Hseih-paper-for-4-3-19-seminar-title-2.pdf). Argues recommenders concentrate suggestions on few options, a neglected problem for reciprocal recommenders.
*Relevance:* Warns against any "top matches" list.

**Mashayekhi et al., "ReCon: Reducing Congestion in Job Recommendation using Optimal Transport"** *(venue/year unverified)*; **Tomita & Yokoyama (2025)** on envy-freeness and Nash social welfare in reciprocal recommenders *(only seen via secondary summary)*; **RecSysHR 2025 paper 6** https://ceur-ws.org/Vol-4046/RecSysHR2025-paper_6.pdf on congestion and orphan jobs.
*Relevance:* Technical routes to fairness (caps, exposure balancing) if we later add suggestions. Not needed for MVP.

### C. Public employment service experiments

**Belot, M., Kircher, P., Muller, P. (2019).** "Providing Advice to Jobseekers at Low Cost: An Experimental Study on Online Advice." *Review of Economic Studies* 86(4): 1411-1447. DOI 10.1093/restud/rdy059. https://docs.iza.org/dp10068.pdf
300 jobseekers over 12 weekly sessions; half were shown other relevant occupations and vacancies. Suggestions broadened search and led to more interviews, driven by those who initially searched narrowly and had been unemployed a few months.
*Relevance:* Support for gentle prompts that widen what people consider, e.g. suggesting companies outside an applicant's first pick.

**Altmann, S., Falk, A., Jäger, S., Zimmermann, F. (2018).** "Learning about job search: A field experiment with job seekers in Germany." *Journal of Public Economics* 164: 33-49. https://docs.iza.org/dp9040.pdf
About 54,000 newly unemployed received an information brochure. Overall effects small and mostly insignificant; for those at high risk of long-term unemployment, employment and earnings rose about 4%.
*Relevance:* Light-touch pre-event preparation can matter most for the hardest-to-place people.

**Le Barbanchon, T., Hensvik, L., Rathelot, R.** "How can AI improve search and matching? Evidence from 59 million personalized job recommendations." (Working paper; Swedish PES; year unverified.) https://www.povertyactionlab.org/media/file-research-paper/how-can-ai-improve-search-and-matching-evidence-59-million-personalized
Two-sided randomised trial: matching probability of treated pairs about 10% higher; net employment effect smaller; larger for less educated, unemployed, broad-scope searchers.
*Relevance:* Shows recommendation can help but mostly reallocates; modest net gains. Treat any nudging as supportive.

**IZA DP 17713** (occupation recommendations and job finding; authors unverified). https://docs.iza.org/dp17713.pdf Both profile-based and experience-based occupation recommendations improve job finding on average.
*Relevance:* Career changers benefit from guidance that aligns with their skills.

**Gee, L.K. (2019).** "The More You Know: Information Effects on Job Application Rates in a Large Field Experiment." *Management Science*. DOI 10.1287/mnsc.2017.2994. https://docs.iza.org/dp10372.pdf
LinkedIn experiment (about 2.3 million people): showing applicant counts raised completion about 3.5%, more for women, and shifted applicant pool composition.
*Relevance:* Showing how many people already plan to meet a company changes behaviour; use carefully because it can create herding.

### D. Job fairs

**Abebe, G., Caria, S., Fafchamps, M., Falco, P., Franklin, S., Quinn, S., Shilpi, F. (2025).** "Matching Frictions and Distorted Beliefs: Evidence from a Job Fair Experiment." *Economic Journal* 135(671): 2089-2121. DOI 10.1093/ej/ueaf026. https://qmul.ac.uk/sef/research/workingpapers/2023/items-/958.html
Randomised job fairs in Addis Ababa. About 75% of attending workers had a meeting; 76 offers, 14 accepted per J-PAL summary; roughly one hire per twelve firms; no average employment effect, but both sides searched harder afterwards. Beliefs about wages, firm requirements and applicant quality were inaccurate.
*Relevance:* The best direct evidence on our problem. Conversations happen but without shared, accurate expectations they do not convert. Single-city, developing-country context; generalisation is limited.

### E. Fairness and the public-sector cautionary case

**Allhutter, D., Cech, F., Fischer, F., Grill, G., Mager, A. (2020).** "Algorithmic Profiling of Job Seekers in Austria: How Austerity Politics Are Made Effective." *Frontiers in Big Data* 3: 5. https://www.frontiersin.org/articles/10.3389/fdata.2020.00005/text
STS analysis of the AMS system that sorts jobseekers into groups by predicted re-employment prospects (A above 66%, C low long-term prospects); argues it embeds social values and austerity goals.
*Relevance:* Why we must not score or rank people.

**2024 study in *Minds and Machines*** (authors unverified). https://link.springer.com/article/10.1007/s11023-024-09706-9 Reports over 30% of jobseekers would be misclassified in its use case and notable gender differences in error rates. Legal status of AMAS (data protection authority ban in 2020 versus court rulings) was reported inconsistently across sources *(unverified)*.

### F. Skills taxonomies

**EURES/ESCO slides** https://esco.ec.europa.eu/system/files/2024-05/Kristof%20Danckaert%20-%20ESCO%20in%20EURES%20conference.pdf : conceptual argument that ESCO skills give finer matching than ISCO occupation codes. **Stalidis (2023)** (IT job ads; ESCO overlap with ad skills is small; https://ommt.ihu.gr/wp-content/uploads/Research/Stalidis_2023_Job-role-description.pdf) and **arXiv 2109.02554** (simulated data; skills-based models can propagate gender segregation). No controlled outcome comparison found. O*NET: not searched *(unverified)*.
*Relevance:* Use ESCO-style skill names to help recruiters phrase requirements, not to auto-match.

### Not found
Peer-reviewed studies of speed-networking or structured matchmaking at hiring events; France Travail and Danish PES experiments beyond the items above; Roth & Peranson (1999) content. Treat these as gaps.

## 3. Mechanism ideas

| Mechanism | Literature basis | Trade-offs |
|---|---|---|
| **Applicant token budget** (e.g. 3-5 "I want to talk to you" signals, no penalty for unused) | Coles et al. 2013; AEA; Lee & Niederle | Reduces spam and conveys interest; under-use is common, so give prompts. Applicants may think signalling is required. Budget size is a tunable guess; no evidence for a specific number. |
| **Recruiter top-4 published before event** | Abebe et al. (belief distortion); information experiments | Fixes expectations; recruiters may submit late or pad requirements, so cap at 4 and rank, with a deadline. |
| **Pre-scheduled slots from signals, human-confirmed** | Roth & Xing (bottlenecks); centralised clearing | Fewer chance encounters and less queueing; reduces serendipity. Matching of slots must be a transparent rule (e.g. signals plus recruiter acceptance), not a score of people. |
| **Company-side "capacity" cap** (max conversations per recruiter, with a short reply option for surplus) | Congestion literature | Protects recruiters; some applicants get declined, so give a visible reason-free "not this time" and an alternative. |
| **Blind-to-popularity display** (do not show how many signals a company has received) | Gee 2019 shows count information shifts behaviour; congestion papers | Avoids herding on popular firms; less transparency. |
| **Gentle widening prompt** ("these 2 other companies need your strength X") | Belot et al. 2019 | Broadens search; must stay a suggestion, never a ranking, and capped to avoid creating new congestion. |
| **Post-event short feedback on belief accuracy** | Abebe et al. | Updates both sides' expectations; adds friction. |

## 4. So what for our design

- **Keep the human in every decision.** AMS shows the reputational and legal risk of scoring people. Our top-4 and applicant examples keep ranking with humans; AI only asks questions. This also fits EU AI Act caution for recruitment.
- **Use signals as the anti-overwhelm mechanism.** Give each applicant a small, fixed token budget and make unused tokens costless. Show recruiters who signalled them and the applicant's top-4 answers, so the signal carries content, not just a name. Signals should be informative about interest only, per AEA guidance.
- **Make the top-4 the shared reference.** Fairs fail partly because requirements and wage expectations are mis-specified; a ranked top-4 given early is the cheapest fix, and the same 4 structure the conversation.
- **Avoid popularity-driven suggestions.** If we recommend, cap the list and diversify; do not publish popularity counts.
- **Target the hard cases.** Evidence on brochures and advice says the benefit concentrates in narrow searchers and long-term-unemployment risk, which maps to internationals and career changers. The question-only AI coach should be offered most visibly to them.
- **Use skills vocabulary lightly.** ESCO terms can help recruiters write requirements, but coverage is incomplete and bias can propagate; no automated scoring.
- **Limits of the evidence.** Signalling evidence comes from dating and academic markets; job-fair evidence is one Ethiopian study. Treat our mechanism as a hypothesis to test with synthetic data and a pilot, not a proven design.

## 5. Sources

- https://econpapers.repec.org/RePEc:aea:aejmic:v:5:y:2013:i:2:p:99-134
- https://www.nber.org/system/files/working_papers/w16185/w16185.pdf
- https://ftp.aeaweb.org/joe/signal/signaling.pdf
- https://marketdesigner.blogspot.com/2010/07/signaling-preferences-in-matching.html
- https://www.nber.org/papers/w17340
- https://econpapers.repec.org/RePEc:kap:expeco:v:18:y:2015:i:4:p:731-755
- https://web.stanford.edu/~alroth/papers/RothXingJPE97.pdf
- https://dblp.org/rec/conf/recsys/PizzatoRCKK10
- https://arxiv.org/abs/2007.16120v1
- https://webarchive.ucr.edu/economics.ucr.edu/wp-content/uploads/2019/10/Hseih-paper-for-4-3-19-seminar-title-2.pdf
- https://ceur-ws.org/Vol-4046/RecSysHR2025-paper_6.pdf
- https://docs.iza.org/dp10068.pdf
- https://econpapers.repec.org/RePEc:oup:restud:v:86:y:2019:i:4:p:1411-1447
- https://docs.iza.org/dp9040.pdf
- https://econpapers.repec.org/RePEc:eee:pubeco:v:164:y:2018:i:c:p:33-49
- https://www.povertyactionlab.org/media/file-research-paper/how-can-ai-improve-search-and-matching-evidence-59-million-personalized
- https://docs.iza.org/dp17713.pdf
- https://docs.iza.org/dp10372.pdf
- https://qmul.ac.uk/sef/research/workingpapers/2023/items-/958.html
- https://www.povertyactionlab.org/evaluation/job-fairs-employment-matching-ethiopia
- https://econpapers.repec.org/RePEc:oup:econjl:v:135:y:2025:i:671:p:2089-2121
- https://www.frontiersin.org/articles/10.3389/fdata.2020.00005/text
- https://link.springer.com/article/10.1007/s11023-024-09706-9
- https://esco.ec.europa.eu/system/files/2024-05/Kristof%20Danckaert%20-%20ESCO%20in%20EURES%20conference.pdf
- https://ommt.ihu.gr/wp-content/uploads/Research/Stalidis_2023_Job-role-description.pdf
- https://ar5iv.labs.arxiv.org/html/2109.02554
