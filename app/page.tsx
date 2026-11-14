import { enterRole } from "@/app/actions/session";
import { coreRequirements } from "@/lib/domain/requirements";
import type { Db } from "@/lib/domain/types";
import { readDb } from "@/lib/store/db";
import { MascotOnEdge } from "./components/MascotOnEdge";

const ENTRIES = [
  { role: "recruiter", tone: "tone-cobalt", label: "Recruiter", detail: "Name the few things you hire on, then meet the people who show them." },
  { role: "applicant", tone: "tone-pink", label: "Applicant", detail: "Tell what you have done, in your own words. Choose who you want to meet." },
  { role: "staff", tone: "tone-ice", label: "Event staff", detail: "See who might need help preparing before the event." },
] as const;

const STEPS = [
  ["Recruiters commit", "1 to 5 core requirements, each with one line on what it looks like in practice."],
  ["Applicants show", "Short real stories, linked to those requirements by the applicant."],
  ["AI only helps", "It asks questions, suggests links and fixes language. Always labelled, never decides."],
  ["People decide", "Recruiters meet anonymous evidence. Both sides answer; a match needs both."],
] as const;

type Slot = { company: string; rank: number; requirement: string; inPractice: string; label: string; title: string; body: string };

const order = (i: number) => ({ "--i": i }) as React.CSSProperties;

/** One real requirement slot with an accepted example from the synthetic store, shown as the hero picture. */
function firstFilledSlot(db: Db): Slot | null {
  for (const company of db.companies) {
    for (const [index, req] of coreRequirements(db, company.id).entries()) {
      const link = db.links.find((l) => l.requirementId === req.id && l.status === "accepted");
      const story = link && db.stories.find((s) => s.id === link.storyId);
      const applicant = story && db.applicants.find((a) => a.id === story.applicantId);
      if (story && applicant) {
        return {
          company: company.name,
          rank: index + 1,
          requirement: req.text,
          inPractice: req.inPractice,
          label: applicant.pseudonym,
          title: story.title,
          body: story.body,
        };
      }
    }
  }
  return null;
}

function SlotFigure({ slot }: { slot: Slot }) {
  return (
    <figure
      aria-label={`Example: ${slot.label} shows evidence for ${slot.company}'s core requirement ${slot.rank}, ${slot.requirement}`}
      className="card !p-0 shadow-[var(--shadow-lift)]"
    >
      <div className="flex flex-wrap items-center gap-x-2 border-b border-line py-3 pl-5 pr-40 text-sm text-muted sm:pl-6">
        <span>{slot.company}</span>
        <span aria-hidden="true">·</span>
        <span>{slot.label}</span>
      </div>
      <div className="px-5 py-5 sm:px-6">
        <div className="flex gap-3">
          <span className="req-no req-no-core" aria-hidden="true">{slot.rank}</span>
          <div className="min-w-0">
            <p className="h3">{slot.requirement}</p>
            <p className="hint mt-1">In practice: {slot.inPractice}</p>
          </div>
        </div>
        <div className="slot-fill mt-5 border-l-2 border-accent pl-4 sm:ml-10">
          <p className="font-semibold">{slot.title}</p>
          <p className="mt-1 line-clamp-4 text-[0.9375rem] leading-relaxed">{slot.body}</p>
          <p className="mt-2 text-sm text-muted">Linked by the applicant</p>
        </div>
      </div>
    </figure>
  );
}

export default async function Home() {
  const slot = firstFilledSlot(await readDb());

  return (
    <main className="page page-wide">
      <section data-enter className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <p className="eyebrow" style={order(0)}>Taito is Finnish for ability. A recruitment event concept for Espoo</p>
          <h1 className="display mt-4" style={order(1)}>Hire on what people have <span className="scribble">done</span></h1>
          <p className="lede" style={order(2)}>
            No CVs and no job ads. Recruiters name the few things they hire on; applicants show real
            examples in their own words. The AI only asks and suggests. People decide.
          </p>
          <form action={enterRole} className="mt-8 grid gap-3" style={order(3)}>
            <p className="label">Open the demo as</p>
            {ENTRIES.map((entry) => (
              <button
                key={entry.role}
                type="submit"
                name="role"
                value={entry.role}
                className={`card card-link tone ${entry.tone} flex w-full flex-col gap-1 !px-5 !py-4 text-left sm:flex-row sm:items-baseline sm:gap-4`}
              >
                <span className="shrink-0 font-serif text-xl text-ink sm:w-28">{entry.label}</span>
                <span className="text-[0.9375rem] text-muted">{entry.detail}</span>
              </button>
            ))}
          </form>
        </div>
        {slot ? (
          <div className="relative mt-36 lg:mt-0" style={order(4)}>
            <SlotFigure slot={slot} />
            <MascotOnEdge pose="laptop" id="hero-mascot" width={190} side="right" inset="0.5rem" />
            <span className="sticker absolute -bottom-16 right-2 sm:-right-8" aria-hidden="true">
              <span>No CV</span>
              <span>needed</span>
            </span>
          </div>
        ) : null}
      </section>

      <section aria-labelledby="how-heading" className="band tone tone-pink mt-36 -mb-16 sm:-mb-20">
        <MascotOnEdge pose="peek" id="band-mascot" width={200} side="right" inset="4%" />
        <h2 id="how-heading" className="h2">How an event runs</h2>
        <ol className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(([title, text], i) => (
            <li key={title}>
              <span className="req-no" aria-hidden="true">{i + 1}</span>
              <p className="h3 mt-3">{title}</p>
              <p className="mt-1 text-[0.9375rem] text-muted">{text}</p>
            </li>
          ))}
        </ol>
        <p className="hint mt-10">Shared demo: other visitors may be clicking at the same time.</p>
      </section>
    </main>
  );
}
