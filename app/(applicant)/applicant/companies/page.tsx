import { coverage } from "@/lib/domain/cards";
import { coreRequirements } from "@/lib/domain/requirements";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { LinkSuggestions } from "./LinkSuggestions";
import type { RequirementOption } from "./ui";

function examplesLine(covered: number, total: number, missing: number[]): string {
  const base = `Your examples: ${covered} of ${total}`;
  return missing.length === 0 ? base : `${base} — no example yet for ${missing.map((n) => `#${n}`).join(", ")}`;
}

export default async function CompaniesPage() {
  const [session, db] = await Promise.all([getSession(), readDb()]);
  const applicant = db.applicants.find((a) => a.id === session.applicantId);

  if (!applicant) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="text-2xl font-semibold">Companies</h1>
        <p className="mt-3">Pick an applicant in the top bar</p>
      </main>
    );
  }

  const atEvent = new Set(db.companyEvents.filter((ce) => ce.eventId === session.eventId).map((ce) => ce.companyId));
  const companies = db.companies.filter((c) => atEvent.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));
  const own = new Set(db.stories.filter((s) => s.applicantId === applicant.id).map((s) => s.id));

  const view = companies.map((company) => {
    const reqs = coreRequirements(db, company.id);
    const accepted = new Set(db.links.filter((l) => l.status === "accepted" && own.has(l.storyId)).map((l) => l.requirementId));
    const missing = reqs.flatMap((r, i) => (accepted.has(r.id) ? [] : [i + 1]));
    return { company, reqs, missing, ...coverage(db, company.id, applicant.id) };
  });
  const options: RequirementOption[] = view.flatMap(({ company, reqs }) =>
    reqs.map((r, i) => ({ id: r.id, companyId: company.id, companyName: company.name, position: i + 1, text: r.text })),
  );
  const stories = db.stories.filter((s) => s.applicantId === applicant.id);

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold">Companies</h1>
      <p className="mt-2 text-neutral-800">
        What each company looks for, and where your own stories fit. The AI only suggests; you decide, and it never changes your story.
      </p>
      <ul className="mt-4 space-y-6">
        {view.map(({ company, reqs, covered, total, missing }) => (
          <li key={company.id}>
            <h2 className="text-xl font-semibold">{company.name}</h2>
            <p className="text-sm text-neutral-800">{company.sector}</p>
            <p className="mt-1 font-medium">{examplesLine(covered, total, missing)}</p>
            <ol className="mt-2 space-y-2">
              {reqs.map((r, i) => (
                <li key={r.id}>
                  <p><span className="font-medium">#{i + 1}</span> {r.text}</p>
                  <p className="text-sm text-neutral-800">In practice: {r.inPractice}</p>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
      <h2 className="mt-8 text-xl font-semibold">Where your stories fit</h2>
      {stories.length === 0 ? <p className="mt-2">Write a story first, then come back to link it.</p> : null}
      <ul className="mt-3 space-y-4">
        {stories.map((story) => (
          <li key={story.id}>
            <LinkSuggestions
              idPrefix={story.id}
              story={{ id: story.id, title: story.title }}
              links={db.links.filter((l) => l.storyId === story.id).map(({ id, requirementId, origin, status, aiReason }) => ({ id, requirementId, origin, status, aiReason }))}
              options={options}
            />
          </li>
        ))}
      </ul>
    </main>
  );
}
