import Link from "next/link";
import { PageHeader } from "@/app/components/PageHeader";
import { EventCalendar } from "@/app/components/EventCalendar";
import { companyCalendar, slotEnd } from "@/lib/domain/calendar";
import { visibleApplicantName } from "@/lib/domain/cards";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { RefreshButton } from "../applicants/ScoreInputs";

export default async function MeetingsPage() {
  const [session, db] = await Promise.all([getSession(), readDb()]);
  const mine = db.meetings.filter((m) => m.eventId === session.eventId && m.companyId === session.companyId);
  const event = db.events.find((e) => e.id === session.eventId);
  const calendar = companyCalendar(db, session.eventId, session.companyId);
  const groups = [
    { status: "booked" as const, title: "Booked", empty: "No booked meetings yet." },
    { status: "requested" as const, title: "Requested, waiting for the applicant", empty: "No open requests." },
  ];

  return (
    <main className="page">
      <PageHeader title="Meetings" actions={<RefreshButton />} />
      {event ? (
        <div className="mt-8">
          <EventCalendar
            event={event}
            calendar={calendar}
            nameFor={(m) => visibleApplicantName(db, session.companyId, m.applicantId)}
            hrefFor={(m) => `/recruiter/meetings/${m.id}`}
          />
        </div>
      ) : null}
      {groups.map((g) => {
        const items = mine.filter((m) => m.status === g.status);
        return (
          <section key={g.status} className="mt-10">
            <h2 className="h2">{g.title}</h2>
            {items.length === 0 ? (
              <p className="empty-slot mt-3">{g.empty}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {items.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/recruiter/meetings/${m.id}`}
                      className="group flex min-h-14 items-center justify-between gap-4 rounded-xl border border-line bg-surface px-5 py-3 font-semibold transition-colors hover:border-accent"
                    >
                      <span className="underline decoration-line-strong underline-offset-4 group-hover:decoration-accent">
                        {visibleApplicantName(db, session.companyId, m.applicantId)}
                      </span>
                      {m.slotStart ? <span className="font-normal text-muted">{`${m.slotStart}\u2013${slotEnd(m.slotStart)}`}</span> : null}
                      <span aria-hidden="true" className="text-accent-ink transition-transform group-hover:translate-x-1">→</span>
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
