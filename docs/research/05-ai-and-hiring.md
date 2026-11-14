# 05 - When AI Meets Hiring: The Collision

Method note: findings come from web search results (summaries of the pages below), not from full reads of the primary PDFs. Figures that varied between sources, or that I could not trace to a primary source, are marked *(unverified)*. Evidence type is tagged: [PR] peer-reviewed or conference paper, [WP] working paper/preprint, [NEWS] journalism, [VENDOR] vendor or consultancy survey, [LAW] legal text or official audit, [LEGAL-COMM] law-firm commentary.

## 1. Key takeaways

1. **Written application material has lost much of its signal value.** On Freelancer.com, once LLMs arrived, proposals got longer and a well-written pitch stopped predicting who got hired (Galdin and Silbert 2025 [WP]). Our "applicants speak in their own words about real examples" idea targets exactly the channel that still carries signal.
2. **AI screeners are biased, and biased toward AI-written text.** LLMs preferred their own generated resumes over human-written ones in 67-82% of comparisons (Xu et al., AIES 2025 [PR]). Name-based bias in resume ranking is documented in peer-reviewed work (Wilson and Caliskan 2024 [PR]) and in journalism (Bloomberg 2024 [NEWS], disputed by a re-analysis).
3. **Humans do not reliably correct AI.** In a 528-person experiment, participants matched a biased AI's picks about 90% of the time under severe bias (UW 2025 [PR, via press release]). "A human clicks approve" is not oversight.
4. **Trust has collapsed on the candidate side.** Gartner: only 26% of applicants trust AI to evaluate them fairly. Greenhouse: 8% of candidates think AI makes hiring fairer, while 70% of hiring managers think it makes decisions faster and better [both VENDOR].
5. **AI as a writing aid is not simply bad.** In a field experiment with about half a million jobseekers, resume writing help raised hiring by about 8% and did not make employers less satisfied (Wiles et al., Management Science 2025 [PR]). The harm comes when everyone has the same tool and the writing no longer separates people, not from help as such. The effect depends on the tool being a polisher of the person's own content.
6. **Regulation points the same way as our concept.** Recruitment AI is high-risk under the EU AI Act (Annex III); emotion recognition in the workplace is banned; human oversight must address automation bias; GDPR Art. 22 restricts solely automated decisions. The Annex III date has reportedly moved to 2 December 2027, but a public organiser should design to the rules now.
7. **Signals that survive AI are live and process-based:** structured conversation, work samples, verifiable references. This is inference from the evidence above plus the interview-fraud data, not a tested result for events.
8. **Fraud is rising alongside AI.** Gartner projects 1 in 4 candidate profiles will be fake by 2028 (a projection, not a measurement) [VENDOR]. Greenhouse reports 41% of US job seekers admit to prompt injection against AI filters [VENDOR]. In-person or live formats gain value.

## 2. Findings

### 2.1 Generative AI and application materials

- **Signal collapse on a freelance platform.** Galdin (Dartmouth) and Silbert (Princeton), "Making Talk Cheap: Generative AI and Labor Market Signaling", arXiv 2511.08785, Nov 2025 [WP, not peer-reviewed]. Using Freelancer.com data, they report longer proposals after LLM tools spread, and that before AI better cover letters strongly predicted hires but afterwards hiring rates were no better for strong pitches than weak ones. A reported counterfactual finds about 19% fewer high-ability hires (figure from a secondary summary, *(unverified)* against the paper). Tuck summary: tuck.dartmouth.edu/news/articles/what-happens-to-hiring-when-ai-writes-job-applications. Pre-AI proposals averaging under 100 words that roughly doubled comes from a Substack summary *(unverified)*. A blog figure that "31% of signals remain reliable" does not trace to the paper; ignore it.
- **Weaker writers gain most from AI cover-letter tools.** A separate paper on an AI cover-letter tool on Freelancer.com (arXiv 2509.25054 [WP]) finds workers with weaker pre-AI writing gained the most, i.e. AI substitutes for the skill rather than revealing it. I saw only the search snippet.
- **Writing help raises hiring when it is a polisher.** Wiles, Munyikwa and Horton, "Algorithmic Writing Assistance on Jobseekers' Resumes Increases Hires", NBER w30886 (2023), published in Management Science 2025 [PR], DOI 10.1287/mnsc.2024.04528. Randomised on nearly 500k jobseekers; treated workers were hired about 8% more (95% CI 3-13%), with resumes that had fewer errors; no evidence employers were less satisfied; no increase in applications sent. Authors' reading: writing is an imperfect ability signal and better writing helps employers judge ability. Caveat: the tool targeted mechanics (spelling, grammar), not wholesale generation. A separate Wiles result that employers were 18% less likely to hire when an LLM wrote their job posts is reported only in a secondary source *(unverified)*.
- **Volume and homogenisation.** I did not find a primary source quantifying an application-volume explosion or homogenisation of CV text in these searches. Treat both as plausible but *(unverified)* here; the Galdin and Silbert result is the best direct evidence on signal loss.
- **Applicant AI use is common.** Gartner Q4 2024 survey of 3,290 candidates: 39% used AI in the application process [VENDOR].

### 2.2 AI screening and its failures

- **Amazon (2014-2017).** Reuters (Dastin, 10 Oct 2018) reported an experimental resume-ranking engine that penalised resumes containing "women's" and downgraded two all-women's colleges; engineers could not guarantee other biases would not emerge and the team was disbanded. Amazon says it was never used by recruiters to evaluate candidates [NEWS; I saw syndicated copies, not the Reuters original]. Example: euronews.com/2018/10/10/amazon-scraps-secret-ai-recruiting-tool-that-showed-bias-against-women.
- **HireVue (2021).** Stopped using facial analysis in new assessments, announced Jan 2021 after discontinuing it in March 2020; the stated reason was that visual analysis added little value and bias concerns. Speech analysis continued, and Fast Company noted the accompanying audit was narrow [NEWS]. fortune.com/2021/01/19/hirevue-drops-facial-monitoring-amid-a-i-algorithm-audit.
- **University of Washington (Wilson and Caliskan 2024).** "Gender, Race, and Intersectional Bias in Resume Screening via Language Model Retrieval", AIES 2024, pp. 1578-1590, arXiv 2407.20371 [PR]. Three text-embedding models, identical resumes with names signalling race and gender; Black male names disadvantaged in up to 100% of comparisons in some conditions; resume length and name frequency affect results. Secondary summaries give different percentages (for example 85.1% race, 51.9% gender; 37% equal gender selection per Brookings) so I report no single headline figure *(unverified)*. Note this tested embedding retrieval models, not chat LLMs.
- **Bloomberg (2024).** 800 demographically distinct names on eight fictitious resumes, 1,000 GPT-3.5 runs, four job postings; Asian-women-associated names ranked top 17.2% of the time vs 12.5% expected; Black-associated names least likely top for financial analyst; Bloomberg said it also found bias with GPT-4 [NEWS]. bloomberg.com/graphics/2024-openai-gpt-hiring-racial-discrimination. A re-analysis by interviewing.io argues Bloomberg did no significance testing, finds bias for GPT-3.5 in HR and finance roles but none for GPT-4 [blog, contested]. Data are public on GitHub. Takeaway: the evidence is mixed and model-dependent, which is itself an argument against delegating ranking to a model.
- **AI-AI bias.** Xu, Li and Jiang, "AI Self-preferencing in Algorithmic Hiring", AIES 2025, arXiv 2509.00462 [PR]. Over 2,200 resumes, 24 occupations: LLMs prefer their own generated resumes over human-written ones, 67-82% in the current version (68-88% in v1); in simulated pipelines, users of the same model as the screener were 23-60% more likely to be shortlisted (per UMD summary). A smaller, less consistent preference exists between different LLMs. Simple self-recognition interventions cut the bias by more than half. A 97.6% figure on an aggregator site could not be verified; ignore it.

### 2.3 The arms race and the trust collapse

- **Greenhouse AI in Hiring report, Nov 2025** [VENDOR; 4,136 respondents in US, UK, Ireland, Germany]. US subset: 46% of job seekers lost trust in hiring in the past year, 42% of them blame AI; only 8% say AI makes hiring fairer; 55% suspect AI evaluated their application; 41% admit prompt injection; 91% of recruiters report spotting candidate deception including deepfakes; 70% of hiring managers believe AI helps them decide faster and better. greenhouse.com newsroom, "An AI trust crisis".
- **Gartner, July 2025** [VENDOR]. Survey of 2,918 candidates (Q1 2025): 26% trust AI to evaluate them fairly; 32% worry AI will fail their application; 6% of 3,000 admit interview fraud; offer acceptance fell from 74% (2Q23) to 51%. Forecast: 1 in 4 candidate profiles fake by 2028 (projection). gartner.com press release 2025-07-31.
- Vendor surveys are self-reported, commercially motivated and mostly US-centred. They show the direction of sentiment, not precise magnitudes. I found no LinkedIn survey in these searches.

### 2.4 Regulation

- **EU AI Act (Reg. 2024/1689).** Employment and recruitment (targeted job ads, filtering applications, evaluating candidates) sit in Annex III point 4, high-risk; I did not retrieve the Annex text in these searches, wording from general knowledge *(unverified here)*. High-risk duties include risk management, data governance, logging, transparency, human oversight, and deployer duties. The Annex III application date was 2 August 2026; sources report a Digital Omnibus deal moving it to 2 December 2027 (provisional deal 7 May 2026, one source says Council approval 29 June 2026). Official Journal publication not confirmed *(unverified)*; substantive duties reportedly unchanged [LEGAL-COMM: Gibson Dunn, Cooley, Hogan Lovells].
- **Art. 5 emotion recognition ban.** Prohibits emotion recognition in the workplace (medical and safety exceptions). Commission guidance reportedly covers the recruitment stage and applies to deployers as well as vendors; also reportedly covers inferred intentions [LEGAL-COMM: WSGR, Freshfields, Wolters Kluwer]. Final-vs-draft guideline text not confirmed. Practical rule: no tone, face, or "enthusiasm" scoring of anyone at our events.
- **Art. 14 human oversight.** Overseers must be able to remain aware of automation bias, particularly for systems that recommend decisions; the Act names automation bias as the only psychological bias it mentions [EC AI Act Service Desk, Art. 14; arXiv 2502.10036 commentary]. An SSRN chapter argues oversight has limits and cannot be the sole safeguard.
- **GDPR Art. 22.** CJEU C-634/21 SCHUFA (7 Dec 2023): an automatically produced score can itself be an Art. 22 "decision" when third parties rely heavily on it [PR/LAW; A&O Shearman, noyb, IAPP summaries]. Implication: a "ranking" that a recruiter merely follows may be caught. Scope is case-specific.
- **NYC Local Law 144.** Requires independent bias audits and published summaries for automated employment decision tools. NY State Comptroller audit (Report 2024-N-6, 2 Dec 2025) found enforcement weak; counts of problematic audits differ between summaries (1 vs at least 17) *(unverified)* [LAW; osc.ny.gov].
- **Illinois AI Video Interview Act (effective 1 Jan 2020).** Notice before the interview, explanation of how the AI works and what it evaluates, applicant consent, limits on sharing and a destroy-on-request right; no private right of action; "AI" undefined [LEGAL-COMM: SHRM, Hunton, AGORA]. A blog claim of a 2026 amendment could not be verified.
- **What this means for a public organiser.** Even if no model scores anyone, any tool that ranks, filters or recommends jobseekers or companies is within scope. The safest path is to keep AI out of evaluation entirely and document that choice. Finnish law and national supervisory details were not researched here.

### 2.5 Human-in-the-loop evidence

- UW study, Nov 2025 (AAAI/ACM AIES), 528 participants, 16 jobs, simulated LLM recommendations: little bias without AI; with AI, participants mirrored its preferences, about 90% under severe bias; mild bias was also followed; an implicit-association-test primer reduced bias by about 13% [PR, from UW news release and trade press; I did not open the paper]. Press retellings sometimes state 90% as general; it applies to the severe condition.
- Implication: oversight designs that show a ranked list and ask for approval do not keep humans in charge. Designs that make the human generate the judgement first, with AI absent or hidden until after, are better supported. That is design reasoning, not a tested result.

### 2.6 Positive uses: coach and translator

- Resume polishing helps, especially non-native speakers according to the researchers (Wiles et al., MIT Sloan coverage) [PR plus NEWS].
- UC eScholarship study of native and non-native writers: AI supports lower-skilled writers on specific tasks but sociolinguistic gaps remain [PR, snippet only] *(unverified detail)*.
- Columbia research brief: AI helps experts with language barriers communicate, but makes expertise harder to distinguish through writing alone for native speakers [NEWS/brief].
- NUS summary of Cao and Li 2025: non-native freelancers gained higher-budget contracts after ChatGPT, though convergence may already have been under way [secondary].
- I found no study directly testing AI as a question-asker or coach versus AI as writer for interviews or applications. That is a gap; our concept's core mechanism is untested and should be framed as a hypothesis for a pilot.

### 2.7 Authenticity signals that survive AI

- Direct evidence from these searches is thin. The pattern implied: written text became cheap (Galdin and Silbert); fraud is rising (Gartner, Greenhouse); so costly or verifiable signals gain value: live back-and-forth, work samples, verified references, process evidence (drafts, how someone reasoned). No source I opened tested these at events *(unverified as a claim of effectiveness)*.

## 3. Design rules for responsible AI in our concept

**Do**
- Use AI only to ask the applicant questions about their own example (what was the situation, what did you do, what was the result, what would a colleague say). Applicant writes every word. Support: signal collapse when text is generated; self-preference bias favours AI-written text.
- Allow translation and spelling-level help clearly labelled as such, chosen by the applicant, because mechanical help raised hiring without hurting employer satisfaction and helps non-native writers. Keep content generation off.
- Let recruiters rank their own requirements into a top four; show applicants the human-written ranking as written.
- Keep all matching decisions with humans: applicants pick companies; recruiters pick whom to talk to after live conversation. Support: Art. 22, SCHUFA, Art. 14, UW 2025 mirroring.
- Have humans form a judgement before seeing any AI-produced material, and avoid ranked AI outputs that invite rubber-stamping.
- Tell participants plainly what the tool does and does not do (Illinois-style notice and explanation), and offer a no-AI path.
- Log what AI was shown to whom, so audits are possible.
- Use synthetic data in the prototype and mark all AI-touched artefacts.

**Don't**
- Don't score, rank, summarise-for-decision, or "match" individual jobseekers with a model, even as a "suggestion".
- Don't analyse voice, face, tone, sentiment or confidence at events (Art. 5, HireVue lesson).
- Don't let AI screen AI-written documents; avoid CV parsing as the gate.
- Don't present vendor survey figures as facts in the pitch; label them as vendor-reported.
- Don't claim compliance; claim a design that avoids high-risk functions, and say what would trigger Annex III duties.

## 4. So what for our design

- The evidence supports shifting the contest away from documents toward structured live conversation, with the four requirements as the shared agenda. Written artefacts become preparation aids, not screening inputs.
- Our "AI asks, human answers" rule is defensible on three independent grounds: signal value (Galdin and Silbert), bias and AI-AI preference (Xu et al., Wilson and Caliskan), and regulation (Art. 5, 14, 22). Its upside for non-native speakers and career changers is plausible but untested; plan a small evaluation (e.g., recruiter-rated clarity of examples with and without the question prompts).
- Avoiding any ranking or scoring function keeps the system plausibly outside the high-risk functions, but we should get legal review rather than assert it. Self-selection by applicants removes the need for any matching algorithm.
- Biggest risks: (a) the question-asking AI subtly steering content or becoming a writer in practice; (b) applicants pasting AI answers anyway, so live follow-up questions matter; (c) trust, since candidates already suspect AI evaluation (Greenhouse 55%), so explicit "no AI evaluates you" messaging is a feature.
- Open questions: how to verify examples cheaply (references, work samples); accessibility for people who struggle to speak live; Finnish-specific legal guidance.

## 5. Sources

Peer-reviewed or conference
- Wilson, K., Caliskan, A. (2024). Gender, Race, and Intersectional Bias in Resume Screening via Language Model Retrieval. AIES 7. https://ojs.aaai.org/index.php/AIES/article/view/31748 ; https://arxiv.org/abs/2407.20371
- Xu, Li, Jiang (2025). AI Self-preferencing in Algorithmic Hiring. AIES. https://ojs.aaai.org/index.php/AIES/article/view/36755 ; https://arxiv.org/abs/2509.00462 ; UMD summary https://today.umd.edu/briefs/study-ai-used-in-hiring-is-biased-toward-itself
- Wiles, Munyikwa, Horton (2025). Algorithmic Writing Assistance on Jobseekers' Resumes Increases Hires. Management Science. https://pubsonline.informs.org/doi/fpi/10.1287/mnsc.2024.04528 ; NBER https://www.nber.org/papers/w30886
- University of Washington (Nov 2025). People mirror AI systems' hiring biases (news release). https://washington.edu/news/2025/11/10/people-mirror-ai-systems-hiring-biases-study-finds
- Automation Bias in the AI Act (arXiv 2502.10036). https://arxiv.org/pdf/2502.10036 ; Human Oversight under Article 14 (SSRN). https://papers.ssrn.com/abstract=5147196

Working papers
- Galdin, Silbert (2025). Making Talk Cheap. https://arxiv.org/abs/2511.08785 ; https://tuck.dartmouth.edu/news/articles/what-happens-to-hiring-when-ai-writes-job-applications
- AI cover-letter tool on Freelancer.com. https://arxiv.org/html/2509.25054v1

News and analysis
- Dastin (Reuters 2018), via https://www.euronews.com/2018/10/10/amazon-scraps-secret-ai-recruiting-tool-that-showed-bias-against-women
- Bloomberg (2024). https://prod.cm.bloomberg.com/graphics/2024-openai-gpt-hiring-racial-discrimination/ ; data https://github.com/BloombergGraphics/2024-openai-gpt-hiring-racial-discrimination ; critique https://interviewing.io/blog/refuting-bloombergs-analysis-chatgpt-isnt-racist
- Fortune (2021), HireVue. https://fortune.com/2021/01/19/hirevue-drops-facial-monitoring-amid-a-i-algorithm-audit ; SHRM https://www.shrm.org/resourcesandtools/hr-topics/talent-acquisition/pages/hirevue-discontinues-facial-analysis-screening.aspx
- MIT Sloan on resume writing help. https://mitsloan.mit.edu/ideas-made-to-matter/job-seekers-ai-boosted-resumes-more-likely-to-be-hired ; Columbia brief https://business.columbia.edu/research-brief/impact-of-generative-ai-on-hiring-and-startups ; NUS summary https://ireus.nus.edu.sg/ai-employment-fairness

Vendor surveys
- Greenhouse (2025). https://www.greenhouse.com/newsroom/an-ai-trust-crisis-70-of-hiring-managers-trust-ai-to-make-faster-and-better-hiring-decisions-only-8-of-job-seekers-call-it-fair
- Gartner (2025-07-31). https://www.gartner.com/en/newsroom/press-releases/2025-07-31-gartner-survey-shows-just-26-percent-of-job-applicants-trust-ai-will-fairly-evaluate-them

Law and legal commentary
- EC AI Act Service Desk, Art. 14. https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-14
- AI Act omnibus delay: https://www.gibsondunn.com/eu-ai-act-omnibus-agreement-postponed-high-risk-deadlines-and-other-key-changes/ ; https://www.hoganlovells.com/en/publications/eu-legislators-agree-to-delay-for-highrisk-ai-rules
- Art. 5 emotion recognition: https://fpf.org/blog/red-lines-under-eu-ai-act-unpacking-the-prohibition-of-emotion-recognition-in-the-workplace-and-education-institutions/ ; https://www.wsgr.com/en/insights/eu-commission-issues-guidelines-on-prohibited-ai-practices-under-eu-ai-act.html
- CJEU C-634/21 SCHUFA. https://collab.dpa.gr/wp-content/uploads/2023/12/CJEU-C-634-21.en_.pdf ; https://iapp.org/news/a/key-takeaways-from-the-cjeus-recent-automated-decision-making-rulings
- NY State Comptroller audit of LL144 enforcement. https://www.osc.ny.gov/state-agencies/audits/2025/12/02/enforcement-local-law-144-automated-employment-decision-tools ; DLA Piper https://www.dlapiper.com/en/insights/publications/2026/01/critical-audit-of-nyc-ai-hiring-law-signals-increased-risk-for-employers
- Illinois AI Video Interview Act. https://agora.eto.tech/instrument/2107 ; https://www.shrm.org/in/topics-tools/employment-law-compliance/illinois-employers-must-comply-artificial-intelligence-video-interview-act
