import { needsHelp } from "@/lib/domain/readiness";
import { readDb } from "@/lib/store/db";
import { OfferButton } from "./OfferButton";

export default async function StaffPage() {
  // Pass only the row fields the table needs; never the whole Db to the client.
  const rows = needsHelp(await readDb());

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Applicants who might need help preparing</h1>
      <p className="mt-2 text-neutral-800">
        These applicants have no story yet, or no accepted example. A person decides whether to offer a coaching session.
      </p>

      {rows.length === 0 ? (
        <p className="mt-6 text-neutral-900">Everyone has at least one story and one accepted example.</p>
      ) : (
        <table className="mt-6 w-full text-left">
          <thead className="sr-only sm:not-sr-only">
            <tr className="border-b border-neutral-400 text-sm text-neutral-800">
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
                className="block border-b border-neutral-300 py-3 sm:table-row"
              >
                <th scope="row" className="block font-medium text-neutral-900 sm:table-cell sm:py-3 sm:pr-3">
                  {row.pseudonym}
                </th>
                <td className="block text-neutral-900 sm:table-cell sm:py-3 sm:pr-3">
                  <span className="text-neutral-700 sm:hidden">Stories: </span>
                  {row.stories}
                </td>
                <td className="block text-neutral-900 sm:table-cell sm:py-3 sm:pr-3">
                  <span className="text-neutral-700 sm:hidden">Accepted examples: </span>
                  {row.acceptedLinks}
                </td>
                <td className="block pt-2 sm:table-cell sm:py-3 sm:pt-3">
                  <OfferButton pseudonym={row.pseudonym} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
