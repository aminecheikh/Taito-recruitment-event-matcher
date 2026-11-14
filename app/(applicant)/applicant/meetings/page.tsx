import Link from "next/link";
import { PageHeader } from "@/app/components/PageHeader";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { AcceptButton, RefreshButton } from "./MeetingControls";

export default async function MeetingsPage() {
  const [session, db] = await Promise.all([getSession(), readDb()]);
  const applicant = db.applicants.find((a) => a.id === session.applicantId);

  if (!applicant) {
    return (
      <main className="page">
        <PageHeader title="Meetings">Pick an applicant in the top bar</PageHeader>
      </main>
    );
  }

  const meetings = db.meetings
    .filter((m) => m.applicantId === applicant.id && m.eventId === session.eventId)
    .map((m) => ({ meeting: m, name: db.companies.find((c) => c.id === m.companyId)?.name ?? m.companyId }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const requested = meetings.filter((m) => m.meeting.status === "requested");
  const booked = meetings.filter((m) => m.meeting.status === "booked");

  return (
    <main className="page">
      <PageHeader eyebrow={applicant.pseudonym} title="Meetings" actions={<RefreshButton />} />

      <h2 className="h2 mt-10">Requests from companies</h2>
      {requested.length === 0 ? <p className="empty-slot mt-3">No requests right now.</p> : null}
      <ul className="mt-3 space-y-4">
        {requested.map(({ meeting, name }) => (
          <li key={meeting.id} className="card border-l-4 border-l-accent">
            <h3 className="font-serif text-xl font-semibold">{name} wants to meet you</h3>
            <p className="mt-2 text-muted">
              If you accept, your name will now be shown to {name}. Until then they only see your anonymous card.
            </p>
            <AcceptButton meetingId={meeting.id} companyName={name} />
          </li>
        ))}
      </ul>

      <h2 className="h2 mt-10">Booked meetings</h2>
      {booked.length === 0 ? <p className="empty-slot mt-3">No booked meetings yet.</p> : null}
      <ul className="mt-3 space-y-3">
        {booked.map(({ meeting, name }) => (
          <li key={meeting.id}>
            <Link
              href={`/applicant/meetings/${meeting.id}`}
              className="card group flex items-center justify-between gap-4 transition-colors hover:border-accent"
            >
              <span>
                <span className="block font-serif text-xl font-semibold">{name}</span>
                <span className="link mt-1 block">Open meeting with {name}</span>
              </span>
              <span aria-hidden="true" className="text-xl text-accent-ink transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
