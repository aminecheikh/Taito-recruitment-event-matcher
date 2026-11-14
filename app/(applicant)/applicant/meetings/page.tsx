import Link from "next/link";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { AcceptButton, RefreshButton } from "./MeetingControls";

export default async function MeetingsPage() {
  const [session, db] = await Promise.all([getSession(), readDb()]);
  const applicant = db.applicants.find((a) => a.id === session.applicantId);

  if (!applicant) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="text-2xl font-semibold">Meetings</h1>
        <p className="mt-3">Pick an applicant in the top bar</p>
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
    <main className="mx-auto max-w-3xl p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Meetings</h1>
        <RefreshButton />
      </div>

      <h2 className="mt-6 text-lg font-semibold">Requests from companies</h2>
      {requested.length === 0 ? <p className="mt-2 text-neutral-800">No requests right now.</p> : null}
      <ul className="mt-2 space-y-4">
        {requested.map(({ meeting, name }) => (
          <li key={meeting.id} className="border border-neutral-400 p-4">
            <h3 className="font-semibold">{name} wants to meet you</h3>
            <p className="mt-1 text-neutral-800">
              If you accept, your name will now be shown to {name}. Until then they only see your anonymous card.
            </p>
            <AcceptButton meetingId={meeting.id} companyName={name} />
          </li>
        ))}
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Booked meetings</h2>
      {booked.length === 0 ? <p className="mt-2 text-neutral-800">No booked meetings yet.</p> : null}
      <ul className="mt-2 space-y-4">
        {booked.map(({ meeting, name }) => (
          <li key={meeting.id} className="border border-neutral-400 p-4">
            <h3 className="font-semibold">{name}</h3>
            <Link href={`/applicant/meetings/${meeting.id}`} className="mt-2 inline-block text-blue-900 underline">
              Open meeting with {name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
