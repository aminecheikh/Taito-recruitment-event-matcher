# Demo script (about 6 minutes)

Pair: **Applicant 017** (bus depot IT support, ticket-reader story) and **Acme Robotics Oy (fictional)**, 4 core requirements. All data is synthetic.

## Before going on stage

1. `npm run dev` in a tmux session. Open `http://localhost:3000`.
2. Real AI for the language step. In `.env` set these names (values stay private, never print them):
   - `AI_PROVIDER` (`google` is the default choice, `anthropic` is the backup)
   - `AI_MODEL`
   - `GOOGLE_GENERATIVE_AI_API_KEY` or `ANTHROPIC_API_KEY`, matching the provider
3. Pre-demo check: `npm run ai:smoke`. It must succeed for the provider you chose. If it fails, switch provider or use the mock path below.
4. Click **Reset demo data** in the top bar. Confirm Applicant 017 has three stories and no links.
5. Backup video of this path is recorded (human task). Open it in a tab.

## Click path

| Time | Who | Click | What to say |
|---|---|---|---|
| 0:00 | Home | Show the home page. | "No CV and no job ad. Recruiters name what they hire on. Applicants show real examples in their own words. AI asks and suggests. People decide." Pain points #2, #5, #6. |
| 0:30 | Recruiter | **I'm a recruiter**, company **Acme Robotics Oy (fictional)**. Page: Core requirements. | "Acme ranks its asks and commits to at most 5 core requirements, each with one line on what it looks like in practice." |
| 0:50 | Recruiter | Tick **Reading electrical schematics** as Core (5 of 5 core), add its "in practice" line, Save. Then tick **Writing test plans** as Core and Save. | The sixth is refused: "Which ones would you actually hire on? Pick at most 5." "The tool pushes back on wishlists. The recruiter decides." (Untick both afterwards so Acme is back at 4. Kestrel Logistics, with a ten-item wishlist, is the spare example.) |
| 1:30 | Applicant | **I'm an applicant**, pick **Applicant 017**. Page: My stories. Open "Ticket readers that froze after an update". | "Her story, her words. The AI never writes it." |
| 1:50 | Applicant | **Ask me a question**. Read the question aloud. Type one short answer. **Add to my story** (optional). | "One recall question, labelled AI question. Only her own typed answer goes into the story." |
| 2:20 | Applicant | **Fix language**. Show Before and After and the label "AI suggestion (language edited)". Click **Keep mine**. | "Grammar fixes and translation are allowed, always labelled, and she chooses. Needs a real provider, see the mock note." |
| 2:50 | Applicant | Page: Companies. Under the ticket-reader story click **Suggest where this fits**. | "The AI points, with a reason that quotes her own words." |
| 3:10 | Applicant | **Accept** suggestion #1 (Debugging embedded systems) and **Accept** suggestion #3 (Working with suppliers). Show "AI suggestion, accepted by you". Page now says 2 of 4. | "She could reject or move it. Nothing is linked until she accepts." |
| 3:40 | Applicant | Page: Signals. Click **Signal Acme Robotics Oy (fictional)**. "2 of 3 signals left." | "A signal says: I chose you on purpose. Three per event, so each one means something. She needed at least one accepted example first." |
| 4:00 | Recruiter | **I'm a recruiter**, page: Who signalled us. Find **Applicant 017** (card says Covers 2 of 4). | "No name. No photo. No AI score. No top-match list. Cards are in alphabetical order. The recruiter filters by a visible coverage rule." |
| 4:30 | Recruiter | Click **Request meeting** on Applicant 017. | "Still anonymous. The slot counter drops." |
| 4:45 | Applicant | **I'm an applicant**, Applicant 017, page: Meetings. Read the notice, click **Accept meeting with Acme Robotics Oy (fictional)**. | "Her name is shown to Acme only now, when she says yes." |
| 5:05 | Recruiter | Page: Meetings, open the meeting. Lakshmi Hartwell (fictional) now shows. Score each core requirement, choose **Continue**, **Submit decision**. | "After the conversation the recruiter scores each requirement 0 to 10. The score informs the answer. It never decides it." |
| 5:25 | Applicant | Open the meeting, choose **Continue**. | "Each side answers alone. Answers are revealed together. A match needs both." |
| 5:40 | Both | Applicant: tick what to share, **Save what I share**. Recruiter: fill contact person, next step, timeline, save. Show both sides. | "Nothing moves without the owner's action. Both sides now see the shared details." |
| 6:00 | End | | Hand back to the pitch. |

## Branch: "not this time" (optional, 45 seconds)

Reset first or use a second applicant. For Applicant 009 (signalled Acme in the seed data): recruiter requests the meeting, Applicant 009 accepts, the recruiter scores, chooses **Not this time** and writes one short line per core requirement (for example "clear example", "would like to see more depth"), the applicant chooses Continue. Both pages show "Not a match this time". Say: "Humans give feedback instead of silence. The stories stay hers for the next event."

## Mock-mode backup (`AI_PROVIDER=mock`, or no provider env)

Same path, no network.

- Follow-up question: returns a fixed ladder of recall questions. Fine to show.
- Link suggestions: for the ticket-reader story, returns #1 Debugging and #3 Suppliers with quoted reasons, exactly the demo path.
- **Fix language and Translate return the text unchanged** in mock. Use a real provider (Gemini default, Claude backup) for that step on stage, or skip it and say "grammar and translation are labelled the same way, here is a story from Applicant 021 labelled translated from Arabic" (open that applicant's meeting card if booked, or just talk to it).
- Run `npm run ai:smoke` with `AI_PROVIDER=mock` to confirm mock works.

## What if AI is down

"The AI is only a helper. Every step has a manual path: she can write the story, link it herself with Link it myself, and the recruiter never uses AI at all after the requirements step. If a provider fails or we are rate limited, the app falls back to a fixed example, labelled 'AI unavailable, showing example'." Then continue on the mock path or the backup video.

## Event-start load line

"Nothing at event time calls an AI. Cards are built before the event from stored data, and each meeting has a Printable card link for the conversation."
