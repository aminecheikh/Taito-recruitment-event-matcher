# Demo script (about 6 to 7 minutes)

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
| 0:25 | Recruiter | **I'm a recruiter**, company **Acme Robotics Oy (fictional)**. Page: Core requirements. | "Acme ranks its asks and commits to at most 5 core requirements, each with one line on what it looks like in practice." |
| 0:40 | Recruiter | Under **Paste an old job ad**, paste "Rank the applicants who signalled us" and click **Suggest requirements**. | The AI refuses: "Taito's AI doesn't rank, score or pick people. A person decides. It can help you describe what you need." "It refuses right where you type. Ordinary lines in a real ad still pass, judging lines are skipped with a count." |
| 1:05 | Recruiter | Tick **Reading electrical schematics** as Core (5 of 5), add its "in practice" line, Save. Then try to tick **Writing test plans** as Core and Save. Then untick **Reading electrical schematics** and Save again. | The sixth is refused: "Which ones would you actually hire on? Pick at most 5." Acme is back at 4 core, so later steps still read "2 of 4". If present: under a core requirement click **Ask me a question** (recruiter question). (Reset demo data if the page is off.) |
| 1:35 | Applicant | **I'm an applicant**, pick **Applicant 017**. Page: My stories. In **Start from your CV**, paste the text from `data/synthetic/talent/demo-cv-017.txt`, click **Find story ideas**. Click **Start this story** on one idea. | "A CV is not required, but if she has one it gives her a head start. Quotes from her own text, one question each. The CV is not saved." |
| 2:05 | Applicant | Open "Ticket readers that froze after an update". Click **Ask me a question**, type one short answer. | "Her story, her words. The AI never writes it. Only her typed answer goes in." |
| 2:25 | Applicant | **Pull the plug:** turn wifi off. Click **Fix language**. | The notice reads "AI unavailable — showing example". "The AI is only a helper. Everything has a manual path." Turn wifi on again. Later, at the meeting step, click **Printable card** (`/card/[meetingId]/print`) to show it needs no AI or network. |
| 2:50 | Applicant | Page: Companies. Click **Suggest where this fits**, then **Accept** suggestion #1 (Debugging embedded systems) and #3 (Working with suppliers). Page says 2 of 4. | "The AI points, with a reason quoting her words. Nothing is linked until she accepts." |
| 3:15 | Applicant | Page: Signals. Click **Signal Acme Robotics Oy (fictional)**. Point out which requirement the company weighs most. | "Three signals per event, so each one means something." |
| 3:35 | Recruiter | **I'm a recruiter**, page: Who signalled us. Show **Table** (switch with **Table / Cards**), the "Weighted score at least" filter, the legend "#1 counts 4×…", and the **Not scored yet** group. | "The recruiter's own order sets the weights. No AI score. Nobody is hidden for lacking a score; the filter never removes people who are not scored yet." |
| 4:15 | Recruiter | Click **Request meeting** on Applicant 017. | "Still anonymous. The slot counter drops." |
| 4:25 | Applicant | **I'm an applicant**, Applicant 017, page: Meetings. Tick "I'm moving to Finland or new here and would like help with permits and moving". Click **Accept meeting with Acme Robotics Oy (fictional)**. | "Her name is shown to Acme only now. The moving help is her choice and stays hidden until both say continue." |
| 4:50 | Recruiter | Meetings, open the meeting. Click **Printable card** once. Score each requirement 0 to 10, see "Weighted: N / 100", choose **Continue**, **Submit decision**. Applicant: choose **Continue**. | "The score informs the answer. It never decides it. Each side answers alone and a match needs both." |
| 5:20 | Recruiter | After the match: "This person would like help with permits and moving" shows with links (Work in Finland, InfoFinland, Migri, Business Espoo). | "Only now, so it can't tip the yes or no." |
| 5:35 | Staff | Open **Staff**. Under **Companies without core requirements** click **Send reminder**. Show **Event insights**: "Too few to compare yet" is the privacy safeguard working with a fresh pool (under 5 signals per group). | "Staff nudge companies, symmetric to helping applicants. Aggregates only." |
| 6:05 | Anyone | Footer link **Privacy and your data**. Show the field table, then **Download my data** and **Delete all my data**. | "Every field has a purpose. Download or delete in one click." |
| 6:25 | End | | Hand back to the pitch. |

## Branch: "not this time" (optional, 45 seconds)

Reset first or use a second applicant. For Applicant 009 (signalled Acme in the seed data): recruiter requests the meeting, Applicant 009 accepts, the recruiter scores, chooses **Not this time** and writes one short line per core requirement (for example "clear example", "would like to see more depth"), the applicant chooses Continue. Both pages show "Not a match this time". Say: "Humans give feedback instead of silence. The stories stay hers for the next event."

## Mock-mode backup (`AI_PROVIDER=mock`, or no provider env)

Same path, no network.

- Follow-up question: returns a fixed ladder of recall questions. Fine to show.
- Link suggestions: for the ticket-reader story, returns #1 Debugging and #3 Suppliers with quoted reasons, exactly the demo path.
- **Fix language and Translate return the text unchanged** in mock. Use a real provider (Gemini default, Claude backup) for that step on stage, or skip it and say "grammar and translation are labelled the same way, here is a story from Applicant 021 labelled translated from Arabic" (open that applicant's meeting card if booked, or just talk to it).
- Run `npm run ai:smoke` with `AI_PROVIDER=mock` to confirm mock works.

## What if AI is down

(This is the same story as the "pull the plug" beat.) "The AI is only a helper. Every step has a manual path: she can write the story, link it herself with Link it myself, and the recruiter never uses AI at all after the requirements step. If a provider fails or we are rate limited, the app falls back to a fixed example, labelled 'AI unavailable, showing example'." Then continue on the mock path or the backup video.

## Event-start load line

"Nothing at event time calls an AI. Cards are built before the event from stored data, and each meeting has a Printable card link for the conversation."
