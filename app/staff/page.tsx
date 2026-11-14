import { PageHeader } from "@/app/components/PageHeader";
import { needsHelp } from "@/lib/domain/readiness";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { OfferButton } from "./OfferButton";

export default async function StaffPage() {
  // Pass only the row fields the table needs; never the whole Db to the client.
  const [session, db] = await Promise.all([getSession(), readDb()]);
  const registered = new Set(db.applicantEvents.filter((ae) => ae.eventId === session.eventId).map((ae) => ae.applicantId));
  const rows = needsHelp(db).filter((row) => registered.has(row.applicantId));

  return (
    <main className="page">
      <PageHeader eyebrow="Event staff" title="Applicants who might need help preparing">
        These applicants have no story yet, or no accepted example. A person decides whether to offer a coaching session.
      </PageHeader>

      {rows.length === 0 ? (
        <p className="empty-slot mt-8">Everyone has at least one story and one accepted example.</p>
      ) : (
        <div className="card mt-8 !py-2">
        <table className="w-full text-left">
          <caption className="sr-only">Listed alphabetically. No scores.</caption>
          <thead className="sr-only sm:not-sr-only">
            <tr className="border-b border-line text-sm text-muted">
              <th scope="col" className="py-2 pr-3 font-semibold">Applicant</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Stories</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Accepted examples</th>
              <th scope="col" className="py-2 font-semibold"><span className="sr-only">Action</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.applicantId}
                className="block border-b border-line py-4 last:border-b-0 sm:table-row"
              >
                <th scope="row" className="block font-semibold sm:table-cell sm:py-4 sm:pr-3">
                  {row.pseudonym}
                </th>
                <td className="block sm:table-cell sm:py-4 sm:pr-3">
                  <span className="text-muted sm:hidden">Stories: </span>
                  {row.stories}
                </td>
                <td className="block sm:table-cell sm:py-4 sm:pr-3">
                  <span className="text-muted sm:hidden">Accepted examples: </span>
                  {row.acceptedLinks}
                </td>
                <td className="block pt-2 sm:table-cell sm:py-4 sm:text-right">
                  <OfferButton pseudonym={row.pseudonym} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </main>
  );
}
