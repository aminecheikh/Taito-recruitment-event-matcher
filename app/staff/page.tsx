import { PageHeader } from "@/app/components/PageHeader";
import { needsHelp } from "@/lib/domain/readiness";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { OfferButton } from "./OfferButton";
import { applicantsAt } from "@/lib/domain/attendance";
import { companiesNotAtEvent, companiesWithoutCore, type CompanyRef } from "@/lib/domain/reminders";
import type { Db } from "@/lib/domain/types";
import { ReminderButton } from "./ReminderButton";

type Kind = "set-requirements" | "join-event";

function CompanyList(props: {
  db: Db;
  eventId: string;
  kind: Kind;
  title: string;
  empty: string;
  buttonLabel: string;
  companies: CompanyRef[];
}) {
  const { db, eventId, kind, title, empty, buttonLabel, companies } = props;
  return (
    <section className="mt-10" aria-labelledby={`list-${kind}`}>
      <h2 id={`list-${kind}`} className="h2">{title}</h2>
      {companies.length === 0 ? (
        <p className="empty-slot mt-4">{empty}</p>
      ) : (
        <ul className="card mt-4 !py-2">
          {companies.map((company) => (
            <li key={company.companyId} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 last:border-b-0">
              <span className="font-semibold">{company.name}</span>
              <ReminderButton
                companyId={company.companyId}
                name={company.name}
                kind={kind}
                label={buttonLabel}
                alreadySent={db.reminders.some(
                  (r) => r.eventId === eventId && r.companyId === company.companyId && r.kind === kind,
                )}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function StaffPage() {
  // Pass only the row fields the table needs; never the whole Db to the client.
  const [session, db] = await Promise.all([getSession(), readDb()]);
  const registered = new Set(applicantsAt(db, session.eventId));
  const rows = needsHelp(db).filter((row) => registered.has(row.applicantId));

  return (
    <main className="page">
      <PageHeader eyebrow="Event staff" title="Applicants who might need help preparing">
        These applicants have no story yet, or no requirement card filled in. A person decides whether to offer a coaching session.
      </PageHeader>

      {rows.length === 0 ? (
        <p className="empty-slot mt-8">Everyone has at least one story and one filled-in requirement card.</p>
      ) : (
        <div className="card mt-8 !py-2">
        <table className="w-full text-left">
          <caption className="sr-only">Listed alphabetically. No scores.</caption>
          <thead className="sr-only sm:not-sr-only">
            <tr className="border-b border-line text-sm text-muted">
              <th scope="col" className="py-2 pr-3 font-semibold">Applicant</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Stories</th>
              <th scope="col" className="py-2 pr-3 font-semibold">Cards filled in</th>
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
                  <span className="text-muted sm:hidden">Cards filled in: </span>
                  {row.answers}
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

      <CompanyList
        db={db}
        eventId={session.eventId}
        kind="set-requirements"
        title="Companies without core requirements"
        empty="Every company at this event has set its core requirements."
        buttonLabel="Send reminder"
        companies={companiesWithoutCore(db, session.eventId)}
      />
      <CompanyList
        db={db}
        eventId={session.eventId}
        kind="join-event"
        title="Companies not at this event yet"
        empty="Every company is already at this event."
        buttonLabel="Invite"
        companies={companiesNotAtEvent(db, session.eventId)}
      />
    </main>
  );
}
