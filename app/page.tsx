import { enterRole } from "@/app/actions/session";

const ENTRIES = [
  { role: "recruiter", label: "I'm a recruiter", detail: "Name the few things you really hire on, then meet the people who show them." },
  { role: "applicant", label: "I'm an applicant", detail: "Tell what you have done, in your own words. Choose who you want to meet." },
  { role: "staff", label: "I'm event staff", detail: "See who might need help preparing before the event." },
] as const;

const PRINCIPLES = [
  ["Recruiters commit", "1 to 5 core requirements, each with one line on what it looks like in practice."],
  ["Applicants show", "Short real stories, linked to those requirements by the applicant."],
  ["AI only helps", "It asks questions, suggests links and fixes language. Always labelled, never decides."],
  ["People decide", "Recruiters meet anonymous evidence. Both sides answer; a match needs both."],
] as const;

export default function Home() {
  return (
    <main className="page page-wide">
      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <div>
          <p className="eyebrow">A recruitment event concept for the City of Espoo</p>
          <h1 className="h1 mt-3 sm:text-5xl">No CV, No Job Ad</h1>
          <p className="lede">
            Recruiters name the few things they hire on. Applicants show real examples in their own
            words. The AI only asks and suggests; people decide.
          </p>
          <ol className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {PRINCIPLES.map(([title, text], i) => (
              <li key={title} className="border-t border-line pt-4">
                <span className="req-no" aria-hidden="true">{i + 1}</span>
                <p className="h3 mt-3">{title}</p>
                <p className="mt-1 text-[0.9375rem] text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h2 className="h2">Start the demo as</h2>
          <form action={enterRole} className="mt-4 flex flex-col gap-3">
            {ENTRIES.map((entry) => (
              <button
                key={entry.role}
                type="submit"
                name="role"
                value={entry.role}
                className="flex w-full items-center gap-4 rounded-lg border border-line border-l-[3px] border-l-accent bg-surface px-5 py-4 text-left transition-colors hover:border-accent hover:bg-accent-soft"
              >
                <span className="flex-1">
                  <span className="block text-lg font-semibold text-ink">{entry.label}</span>
                  <span className="mt-0.5 block text-[0.9375rem] text-muted">{entry.detail}</span>
                </span>
              </button>
            ))}
          </form>
          <p className="mt-6 text-sm text-muted">Shared demo: other visitors may be clicking at the same time.</p>
        </div>
      </div>
    </main>
  );
}
