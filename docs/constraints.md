# Constraints & Compliance

Non-negotiable rules from the challenge, plus the regulatory context they come from. Check every idea and every feature against this page.

## Challenge rules

1. **Synthetic data only.** No real people, companies' internal data, or scraped personal profiles. See [../data/synthetic/README.md](../data/synthetic/README.md).
2. **No automated profiling or automated decision-making about individuals without human involvement.** The system may suggest, explain, organise and prepare — a human decides.
3. **Minimise personal data.** Collect only what a feature needs; show how privacy would be protected in a real deployment.
4. **Fairness & inclusion.** Must not disadvantage people by nationality, language, educational background, career path, or other characteristics unrelated to the opportunity.
5. **Transparency.** Users should understand why they are seeing a suggestion.

## EU AI Act — why it matters here

- **Recruitment is a high-risk use case.** Annex III, point 4(a): AI systems for recruitment or selection — placing targeted job ads, analysing and filtering applications, evaluating candidates.
- **Profiling keeps it high-risk.** The Art. 6(3) exemption for "narrow procedural" Annex III systems does not apply when the system profiles natural persons.
- **High-risk obligations** (relevant to tell the jury how a real deployment would comply): risk management (Art. 9), data governance and bias examination (Art. 10), technical documentation and logging (Art. 11–12), transparency to deployers (Art. 13), human oversight (Art. 14), accuracy/robustness (Art. 15). Public bodies deploying high-risk AI also run a fundamental rights impact assessment (Art. 27).
- **Prohibited:** emotion recognition in the workplace/education (Art. 5(1)(f)) — rules out "analyse the candidate's video/voice for confidence" ideas. Also no biometric categorisation inferring sensitive traits.
- **Transparency duties (Art. 50):** tell people when they interact with an AI system (e.g. a chatbot) and label AI-generated content where required.

### Design patterns that keep risk low

- AI helps people **describe themselves** (structuring their own input) rather than **scoring** them.
- Matching outputs are **suggestions with reasons**, shown to the person concerned, editable and dismissible.
- Symmetric treatment: companies get the same "clarify your need" support talent gets.
- Organiser stays the human in the loop for any curation.
- Log what the system suggested and why (auditability), without logging more personal data than needed.

### Known MVP limits

- Language labels are enforced in the UI; a real deployment has the language route return a signed one-time token that saveStory verifies.

## GDPR

- **Art. 22** — right not to be subject to a decision based solely on automated processing with significant effects. Hiring/shortlisting counts.
- **Art. 5** — data minimisation, purpose limitation, storage limitation. Define retention (e.g. delete event data N days after follow-up window).
- **Art. 25** — privacy by design and by default.
- **Art. 35** — a DPIA would be required for a real deployment (systematic evaluation in employment context).
- Lawful basis for a public-sector organiser is likely public task (Art. 6(1)(e)) for the core service; consent for optional extras. Confirm with Espoo mentors.

## Operational constraints

- **Load spikes at event start** (pain point #8): anything live during the event must cope with everyone joining at once — prefer static/cached content, pre-computed agendas, graceful degradation.
- **Hybrid formats**: online, in person, and mixed.
- **International participants**: multilingual, plain language, no assumption of Finnish-specific credentials.
