import Link from "next/link";
import { notFound } from "next/navigation";
import { buildCard } from "@/lib/domain/cards";
import { revealDecisions } from "@/lib/domain/decisions";
import { coreRequirements } from "@/lib/domain/requirements";
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
  if (rows.length === 0) return <p className="mt-2">The applicant has not shared contact details yet. Refresh later.</p>;
  return (
    <dl className="mt-2 space-y-1">
      {rows.map(([label, value], i) => (
        <div key={`${label}-${i}`}>
          <dt className="inline font-medium">{label}: </dt>
          <dd className="inline break-all">{value}</dd>
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
      <section className="mt-6">
        <h2 className="text-lg font-semibold">{mine ? "Waiting for the applicant" : "Waiting for your decision"}</h2>
        <p className="mt-1">Decisions are shown only when both sides have decided.</p>
        <div className="mt-2">
          <RefreshButton />
        </div>
      </section>
    );
  }
  if (!reveal.match) {
    return (
      <section className="mt-6">
        <h2 className="text-lg font-semibold">Not a match</h2>
        {reveal.feedback && (
          <ul className="mt-2 list-disc pl-5">
            {coreRequirements(db, meeting.companyId).map((r) => (
              <li key={r.id}>
                {r.text}: {reveal.feedback?.[r.id]}
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }
  const company = db.shares.find((s) => s.meetingId === meeting.id)?.company;
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">Match — shared details</h2>
      <h3 className="mt-3 font-medium">From the applicant</h3>
      <ApplicantShared db={db} meetingId={meeting.id} />
      <h3 className="mt-3 font-medium">From your company</h3>
      {company ? (
        <dl className="mt-2 space-y-1">
          <div><dt className="inline font-medium">Contact person: </dt><dd className="inline">{company.contactPerson}</dd></div>
          <div><dt className="inline font-medium">Next step: </dt><dd className="inline">{company.nextStep}</dd></div>
          <div><dt className="inline font-medium">Timeline: </dt><dd className="inline">{company.timeline}</dd></div>
        </dl>
      ) : (
        <ShareForm meetingId={meeting.id} />
      )}
      <div className="mt-3">
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
  const decided = db.decisions.some((d) => d.meetingId === meeting.id && d.side === "company");
  const requirements = coreRequirements(db, meeting.companyId).map((r) => ({ id: r.id, text: r.text }));

  return (
    <main className="mx-auto max-w-3xl p-4">
      <p>
        <Link href="/recruiter/meetings" className="underline">
          All meetings
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Meeting with {card.label}</h1>
      <div className="mt-4">
        <EvidenceCard card={card} />
      </div>
      {meeting.status === "requested" ? (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Waiting for the applicant to accept</h2>
          <div className="mt-2">
            <RefreshButton />
          </div>
        </section>
      ) : (
        <>
          <p className="mt-4">
            <Link href={`/card/${meeting.id}/print`} className="underline">
              Printable card
            </Link>
          </p>
          {decided ? <Outcome db={db} meeting={meeting} /> : <DecideForm meetingId={meeting.id} requirements={requirements} />}
        </>
      )}
    </main>
  );
}
