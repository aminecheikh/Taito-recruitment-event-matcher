import Link from "next/link";
import { visibleApplicantName } from "@/lib/domain/cards";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { RefreshButton } from "../applicants/ScoreInputs";

export default async function MeetingsPage() {
  const [session, db] = await Promise.all([getSession(), readDb()]);
  const mine = db.meetings.filter((m) => m.eventId === session.eventId && m.companyId === session.companyId);
  const groups = [
    { status: "booked" as const, title: "Booked", empty: "No booked meetings yet." },
    { status: "requested" as const, title: "Requested, waiting for the applicant", empty: "No open requests." },
  ];

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold">Meetings</h1>
      <div className="mt-3">
        <RefreshButton />
      </div>
      {groups.map((g) => {
        const items = mine.filter((m) => m.status === g.status);
        return (
          <section key={g.status} className="mt-6">
            <h2 className="text-lg font-semibold">{g.title}</h2>
            {items.length === 0 ? (
              <p className="mt-2 text-neutral-700">{g.empty}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {items.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/recruiter/meetings/${m.id}`}
                      className="block min-h-11 rounded border border-neutral-700 px-3 py-2 text-neutral-900 underline"
                    >
                      {visibleApplicantName(db, session.companyId, m.applicantId)}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </main>
  );
}
