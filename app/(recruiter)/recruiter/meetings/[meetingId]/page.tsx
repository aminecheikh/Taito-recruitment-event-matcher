import Link from "next/link";
import { notFound } from "next/navigation";
import { formatSlot } from "@/lib/domain/calendar";
import { formatEventDate } from "@/lib/domain/eventFormat";
import { buildCard } from "@/lib/domain/cards";
import { revealDecisions } from "@/lib/domain/decisions";
import { coreRequirements } from "@/lib/domain/requirements";
import { weightedScore } from "@/lib/domain/scores";
import type { Db, Meeting } from "@/lib/domain/types";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { RefreshButton } from "../../applicants/ScoreInputs";
import { EvidenceCard } from "../../applicants/EvidenceCard";
import { DecideForm, ShareForm } from "./DecideForm";

type Params = Promise<{ meetingId: string }>;

function ApplicantShared({ db, meetingId }: { db: Db; meetingId: string }) {
  const part = db.shares.find((s) => s.meetingId === meetingId)?.applicant;
  const rows: [string, string][] = [
    ...(part?.contact ? ([["Contact", part.contact]] as [string, string][]) : []),
    ...(part?.cvUrl ? ([["CV", part.cvUrl]] as [string, string][]) : []),
    ...(part?.links ?? []).map((l): [string, string] => ["Link", l]),
  ];
  if (rows.length === 0) return <p className="empty-slot mt-3">The applicant has not shared contact details yet. Refresh later.</p>;
  return (
    <dl className="mt-3 space-y-2">
      {rows.map(([label, value], i) => (
        <div key={`${label}-${i}`}>
          <dt className="label">{label}</dt>
          <dd className="mt-0.5 break-all">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Outcome({ db, meeting }: { db: Db; meeting: Meeting }) {
  const reveal = revealDecisions(db, meeting.id);
  const mine = db.decisions.some((d) => d.meetingId === meeting.id && d.side === "company");
  if (reveal.status === "waiting") {
    return (
      <section className="card mt-8 border-l-4 border-l-accent">
        <h2 className="h2">{mine ? "Waiting for the applicant" : "Waiting for your decision"}</h2>
        <p className="mt-2 text-muted">Decisions are shown only when both sides have decided.</p>
        <div className="mt-4">
          <RefreshButton />
        </div>
      </section>
    );
  }
  if (!reveal.match) {
    return (
      <section className="card mt-8">
        <h2 className="h2">Not a match</h2>
        {reveal.feedback && (
          <ul className="mt-4 divide-y divide-line border-t border-line">
            {coreRequirements(db, meeting.companyId).map((r) => (
              <li key={r.id} className="py-3">
                <p className="font-semibold">{r.text}</p>
                <p className="mt-0.5">{reveal.feedback?.[r.id]}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }
  const company = db.shares.find((s) => s.meetingId === meeting.id)?.company;
  return (
    <section className="card moment-match mt-8 border-l-4 border-l-[var(--success)]">
      <p><span className="tag tag-success">Both chose to continue</span></p>
      <h2 className="h2 mt-3">Match — shared details</h2>
      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div>
          <h3 className="h3">From the applicant</h3>
          <ApplicantShared db={db} meetingId={meeting.id} />
        </div>
        <div>
          <h3 className="h3">From your company</h3>
          {company ? (
            <dl className="mt-3 space-y-2">
              <div><dt className="label">Contact person</dt><dd className="mt-0.5">{company.contactPerson}</dd></div>
              <div><dt className="label">Next step</dt><dd className="mt-0.5">{company.nextStep}</dd></div>
              <div><dt className="label">Timeline</dt><dd className="mt-0.5">{company.timeline}</dd></div>
            </dl>
          ) : (
            <ShareForm meetingId={meeting.id} />
          )}
        </div>
      </div>
      <div className="mt-6">
        <RefreshButton />
      </div>
    </section>
  );
}

export default async function MeetingPage({ params }: { params: Params }) {
  const [session, db, { meetingId }] = await Promise.all([getSession(), readDb(), params]);
  const meeting = db.meetings.find((m) => m.id === meetingId && m.companyId === session.companyId);
  if (!meeting) notFound();
  const card = buildCard(db, meeting.companyId, meeting.applicantId);
  const meetingEvent = db.events.find((e) => e.id === meeting.eventId);
  const decided = db.decisions.some((d) => d.meetingId === meeting.id && d.side === "company");
  const weighted = weightedScore(db, meeting.companyId, meeting.applicantId, "conversation");
  const requirements = coreRequirements(db, meeting.companyId).map((r) => ({ id: r.id, text: r.text }));

  return (
    <main className="page page-wide">
      <p>
        <Link href="/recruiter/meetings" className="link">
          ← All meetings
        </Link>
      </p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <h1 className="h1">Meeting with {card.label}</h1>
        {meeting.status === "requested" ? null : (
          <Link href={`/card/${meeting.id}/print`} className="btn">
            Printable card
          </Link>
        )}
      </div>
      {meeting.slotStart ? (
        <p className="lede">
          Booked time: {formatSlot(meeting.slotStart)}
          {meetingEvent ? ` · ${meetingEvent.name}, ${formatEventDate(meetingEvent.date)}` : ""}
        </p>
      ) : null}
      <div className="mt-8">
        <EvidenceCard card={card} />
      </div>
      {weighted === undefined ? null : (
        <p className="hint mt-4">Weighted: {weighted} / 100. It informs your decision; it doesn&apos;t make it.</p>
      )}
      {meeting.status === "requested" ? (
        <section className="card mt-8 border-l-4 border-l-accent">
          <h2 className="h2">Waiting for the applicant to accept</h2>
          <div className="mt-4">
            <RefreshButton />
          </div>
        </section>
      ) : (
        <>
          {decided ? <Outcome db={db} meeting={meeting} /> : <DecideForm meetingId={meeting.id} requirements={requirements} />}
        </>
      )}
    </main>
  );
}
