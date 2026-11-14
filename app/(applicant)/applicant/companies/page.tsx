import { PageHeader } from "@/app/components/PageHeader";
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
      <main className="page">
        <PageHeader title="Companies">Pick an applicant in the top bar</PageHeader>
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
    <main className="page">
      <PageHeader eyebrow={applicant.pseudonym} title="Companies">
        What each company looks for, and where your own stories fit. The AI only suggests; you decide, and it never changes your story.
      </PageHeader>
      <ul className="mt-8 space-y-5">
        {view.map(({ company, reqs, covered, total, missing }) => (
          <li key={company.id} className="card">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div>
                <h2 className="h2">{company.name}</h2>
                <p className="hint mt-1">{company.sector}</p>
              </div>
              <span className={`tag ${missing.length === 0 ? "tag-success" : "tag-accent"}`}>{examplesLine(covered, total, missing)}</span>
            </div>
            <ol className="mt-5 divide-y divide-line border-t border-line">
              {reqs.map((r, i) => (
                <li key={r.id} className="flex gap-4 py-3.5">
                  <span className="req-no req-no-core" aria-label={`Core requirement ${i + 1}`}>{i + 1}</span>
                  <div>
                    <p className="font-semibold">{r.text}</p>
                    <p className="hint mt-0.5">In practice: {r.inPractice}</p>
                  </div>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ul>
      <h2 className="h2 mt-12">Where your stories fit</h2>
      <p className="hint mt-1">Ask for a suggestion, or link a story yourself. Nothing is linked until you accept it.</p>
      {stories.length === 0 ? <p className="empty-slot mt-4">Write a story first, then come back to link it.</p> : null}
      <ul className="mt-4 space-y-4">
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
