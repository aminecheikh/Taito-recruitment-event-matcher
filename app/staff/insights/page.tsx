import { PageHeader } from "@/app/components/PageHeader";
import { MIN_GROUP_SIZE, demandReport, processCheck } from "@/lib/domain/insights";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";

export default async function InsightsPage() {
  const [session, db] = await Promise.all([getSession(), readDb()]);
  const demand = demandReport(db, session.eventId);
  const check = processCheck(db, session.eventId);

  return (
    <main className="page">
      <PageHeader eyebrow="Event staff" title="Event insights">
        Counts only, about requirements and the process. Nothing here ranks or scores a person.
      </PageHeader>

      <section className="mt-8">
        <h2 className="h2">Skills demand</h2>
        <p className="hint mt-1">Core requirements with the fewest registered applicants who have an example, thinnest first. Useful for planning coaching.</p>
        {demand.length === 0 ? (
          <p className="empty-slot mt-4">No company at this event has set core requirements yet.</p>
        ) : (
          <div className="card mt-4 !py-2">
            <table className="w-full text-left">
              <caption className="sr-only">Core requirements, thinnest supply first</caption>
              <thead>
                <tr className="border-b border-line text-sm text-muted">
                  <th scope="col" className="py-2 pr-3 font-semibold">Company</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Requirement</th>
                  <th scope="col" className="py-2 font-semibold">With an example</th>
                </tr>
              </thead>
              <tbody>
                {demand.map((row) => (
                  <tr key={`${row.companyName}-${row.rank}`} className="border-b border-line last:border-b-0">
                    <td className="py-3 pr-3">{row.companyName}</td>
                    <td className="py-3 pr-3">{row.requirementText}</td>
                    <td className="py-3">{row.withExample} of {row.registered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="h2">Process fairness</h2>
        <p className="hint mt-1">
          Do signals whose examples carry an AI language label (&quot;language edited&quot; or &quot;translated&quot;) lead to fewer meeting requests? The label is set only when an applicant accepts an AI suggestion. No nationality or language data is used.
        </p>
        {check.comparable ? (
          <div className="card mt-4 !py-2">
            <table className="w-full text-left">
              <caption className="sr-only">Meeting requests by whether AI language help was used</caption>
              <thead>
                <tr className="border-b border-line text-sm text-muted">
                  <th scope="col" className="py-2 pr-3 font-semibold">Group</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Signals</th>
                  <th scope="col" className="py-2 font-semibold">Meetings requested</th>
                </tr>
              </thead>
              <tbody>
                {check.groups.map((g) => (
                  <tr key={g.label} className="border-b border-line last:border-b-0">
                    <th scope="row" className="py-3 pr-3 font-semibold">{g.label}</th>
                    <td className="py-3 pr-3">{g.signals}</td>
                    <td className="py-3">{g.meetingsRequested} of {g.signals}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-slot mt-4">Too few to compare yet. Each group needs at least {MIN_GROUP_SIZE} signals before a rate is shown.</p>
        )}
      </section>
    </main>
  );
}
