import Link from "next/link";
import { EvidenceCard } from "@/app/(recruiter)/recruiter/applicants/EvidenceCard";
import { slotEnd } from "@/lib/domain/calendar";
import { formatEventDate } from "@/lib/domain/eventFormat";
import { buildCard } from "@/lib/domain/cards";
import { revealDecisions } from "@/lib/domain/decisions";
import type { ShareChoice } from "@/lib/domain/shareInput";
import type { Db, Meeting, Share } from "@/lib/domain/types";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { RefreshButton } from "../MeetingControls";
import { DecisionButtons, ShareForm } from "./ApplicantDecision";

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="page page-wide">{children}</main>;
}

function initialChoice(share: Share["applicant"]): ShareChoice {
  return {
    shareEmail: Boolean(share?.contact),
    shareCv: Boolean(share?.cvUrl),
    cvUrl: share?.cvUrl ?? "",
    sharePortfolio: Boolean(share?.links?.length),
    portfolioUrl: share?.links?.[0] ?? "",
  };
}

function CompanyDetails({ company }: { company: Share["company"] }) {
  if (!company) return <p className="empty-slot mt-3">The company has not added contact details yet. Refresh later.</p>;
  return (
    <dl className="mt-3 grid gap-4 sm:grid-cols-3">
      <div><dt className="label">Contact person</dt><dd className="mt-0.5">{company.contactPerson}</dd></div>
      <div><dt className="label">Next step</dt><dd className="mt-0.5">{company.nextStep}</dd></div>
      <div><dt className="label">Timeline</dt><dd className="mt-0.5">{company.timeline}</dd></div>
    </dl>
  );
}

function Result({ db, meeting, applicantEmail }: { db: Db; meeting: Meeting; applicantEmail: string }) {
  const reveal = revealDecisions(db, meeting.id);
  if (reveal.status === "waiting") {
    const mine = db.decisions.some((d) => d.meetingId === meeting.id && d.side === "applicant");
    return (
      <section className="card mt-8 border-l-4 border-l-accent">
        <h2 className="h2">{mine ? "Waiting for the company" : "After the meeting"}</h2>
        {mine ? (
          <>
            <p className="mt-2 text-muted">You decided. Results show only when both sides have decided.</p>
            <div className="mt-4"><RefreshButton /></div>
          </>
        ) : (
          <>
            <p className="mt-2 text-muted">Do you want to continue with this company? They will not see your answer until they have decided too.</p>
            <DecisionButtons meetingId={meeting.id} />
          </>
        )}
      </section>
    );
  }
  if (reveal.match) {
    const share = db.shares.find((s) => s.meetingId === meeting.id);
    return (
      <section className="card moment-match mt-8 border-l-4 border-l-[var(--success)]">
        <p><span className="tag tag-success">Both chose to continue</span></p>
        <h2 className="h2 mt-3">It is a match</h2>
        <p className="mt-2 text-muted">Both of you chose to continue. Choose what you share with the company.</p>
        <ShareForm meetingId={meeting.id} email={applicantEmail} initial={initialChoice(share?.applicant)} />
        <div className="mt-8 border-t border-line pt-6">
          <h3 className="h3">From the company</h3>
          <CompanyDetails company={share?.company} />
          <div className="mt-4"><RefreshButton /></div>
        </div>
      </section>
    );
  }
  const reqs = db.requirements.filter((r) => r.companyId === meeting.companyId && r.isCore).sort((a, b) => a.rank - b.rank);
  const feedback = new Map(Object.entries(reveal.feedback ?? {}));
  return (
    <section className="card mt-8">
      <h2 className="h2">Not a match this time</h2>
      {feedback.size > 0 ? (
        <>
          <p className="mt-2 text-muted">The feedback from the company on each core requirement:</p>
          <ul className="mt-4 divide-y divide-line border-t border-line">
            {reqs.map((r) => (
              <li key={r.id} className="py-3">
                <p className="font-semibold">{r.text}</p>
                <p className="mt-0.5">{feedback.get(r.id) ?? "No feedback given."}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p className="mt-6 font-serif text-lg">Your stories stay yours for the next event.</p>
    </section>
  );
}

export default async function MeetingPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const [session, db, { meetingId }] = await Promise.all([getSession(), readDb(), params]);
  const applicant = db.applicants.find((a) => a.id === session.applicantId);
  if (!applicant) {
    return <Shell><h1 className="h1">Meeting</h1><p className="lede">Pick an applicant in the top bar</p></Shell>;
  }
  const meeting = db.meetings.find((m) => m.id === meetingId && m.applicantId === applicant.id);
  const back = <Link href="/applicant/meetings" className="link">← Back to meetings</Link>;
  if (!meeting) {
    return <Shell><h1 className="h1">Meeting not found</h1><p className="mt-4">{back}</p></Shell>;
  }
  const company = db.companies.find((c) => c.id === meeting.companyId);
  const name = company?.name ?? meeting.companyId;
  if (meeting.status !== "booked") {
    return (
      <Shell>
        <h1 className="h1">Meeting with {name}</h1>
        <p className="lede">Accept this request on the meetings page first.</p>
        <p className="mt-4">{back}</p>
      </Shell>
    );
  }
  const card = buildCard(db, meeting.companyId, applicant.id);
  const meetingEvent = db.events.find((e) => e.id === meeting.eventId);
  return (
    <Shell>
      <p>{back}</p>
      <h1 className="h1 mt-4">Meeting with {name}</h1>
      {meeting.slotStart ? (
        <p className="lede">
          Booked time: {`${meeting.slotStart}\u2013${slotEnd(meeting.slotStart)}`}
          {meetingEvent ? ` · ${meetingEvent.name}, ${formatEventDate(meetingEvent.date)}` : ""}
        </p>
      ) : null}
      <p className="lede">This is the card {name} sees. Your name is shown to them now.</p>
      <div className="mt-8"><EvidenceCard card={card} /></div>
      <Result db={db} meeting={meeting} applicantEmail={applicant.contact.email} />
    </Shell>
  );
}
