import Link from "next/link";
import { PageHeader } from "@/app/components/PageHeader";
import { coverage } from "@/lib/domain/cards";
import { coreRequirements } from "@/lib/domain/requirements";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { companiesAt } from "@/lib/domain/attendance";

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

  const atEvent = new Set(companiesAt(db, session.eventId));
  const companies = db.companies.filter((c) => atEvent.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));

  const view = companies.map((company) => {
    const reqs = coreRequirements(db, company.id);
    const answered = new Set(db.answers.filter((a) => a.applicantId === applicant.id).map((a) => a.requirementId));
    const missing = reqs.flatMap((r, i) => (answered.has(r.id) ? [] : [i + 1]));
    return { company, reqs, missing, ...coverage(db, company.id, applicant.id) };
  });

  return (
    <main className="page">
      <PageHeader eyebrow={applicant.pseudonym} title="Companies">
        What each company looks for. Open a company to fill in one card per requirement; the AI only suggests, you decide.
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
            <p className="mt-5"><Link href={`/applicant/companies/${company.id}`} className="btn btn-primary">Fill in requirement cards</Link></p>
          </li>
        ))}
      </ul>
    </main>
  );
}
