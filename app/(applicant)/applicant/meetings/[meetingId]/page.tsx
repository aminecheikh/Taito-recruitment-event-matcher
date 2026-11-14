import Link from "next/link";
import { EvidenceCard } from "@/app/(recruiter)/recruiter/applicants/EvidenceCard";
import { buildCard } from "@/lib/domain/cards";
import { revealDecisions } from "@/lib/domain/decisions";
import type { ShareChoice } from "@/lib/domain/shareInput";
import type { Db, Meeting, Share } from "@/lib/domain/types";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { RefreshButton } from "../MeetingControls";
import { DecisionButtons, ShareForm } from "./ApplicantDecision";

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto max-w-3xl p-4">{children}</main>;
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
  if (!company) return <p className="mt-2 text-neutral-800">The company has not added contact details yet. Refresh later.</p>;
  return (
    <dl className="mt-2 space-y-2">
      <div><dt className="font-medium">Contact person</dt><dd>{company.contactPerson}</dd></div>
      <div><dt className="font-medium">Next step</dt><dd>{company.nextStep}</dd></div>
      <div><dt className="font-medium">Timeline</dt><dd>{company.timeline}</dd></div>
    </dl>
  );
}

function Result({ db, meeting, applicantEmail }: { db: Db; meeting: Meeting; applicantEmail: string }) {
  const reveal = revealDecisions(db, meeting.id);
  if (reveal.status === "waiting") {
    const mine = db.decisions.some((d) => d.meetingId === meeting.id && d.side === "applicant");
    return (
      <section className="mt-6">
        <h2 className="text-lg font-semibold">{mine ? "Waiting for the company" : "After the meeting"}</h2>
        {mine ? (
          <>
            <p className="mt-2 text-neutral-800">You decided. Results show only when both sides have decided.</p>
            <div className="mt-3"><RefreshButton /></div>
          </>
        ) : (
          <>
            <p className="mt-2 text-neutral-800">Do you want to continue with this company? They will not see your answer until they have decided too.</p>
            <DecisionButtons meetingId={meeting.id} />
          </>
        )}
      </section>
    );
  }
  if (reveal.match) {
    const share = db.shares.find((s) => s.meetingId === meeting.id);
    return (
      <section className="mt-6">
        <h2 className="text-lg font-semibold">It is a match</h2>
        <p className="mt-2 text-neutral-800">Both of you chose to continue. Choose what you share with the company.</p>
        <ShareForm meetingId={meeting.id} email={applicantEmail} initial={initialChoice(share?.applicant)} />
        <h3 className="mt-6 font-semibold">From the company</h3>
        <CompanyDetails company={share?.company} />
        <div className="mt-3"><RefreshButton /></div>
      </section>
    );
  }
  const reqs = db.requirements.filter((r) => r.companyId === meeting.companyId && r.isCore).sort((a, b) => a.rank - b.rank);
  const feedback = new Map(Object.entries(reveal.feedback ?? {}));
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">Not a match this time</h2>
      {feedback.size > 0 ? (
        <>
          <p className="mt-2 text-neutral-800">The feedback from the company on each core requirement:</p>
          <ul className="mt-2 space-y-3">
            {reqs.map((r) => (
              <li key={r.id}>
                <p className="font-medium">{r.text}</p>
                <p>{feedback.get(r.id) ?? "No feedback given."}</p>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      <p className="mt-4 font-medium">Your stories stay yours for the next event.</p>
    </section>
  );
}

export default async function MeetingPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const [session, db, { meetingId }] = await Promise.all([getSession(), readDb(), params]);
  const applicant = db.applicants.find((a) => a.id === session.applicantId);
  if (!applicant) {
    return <Shell><h1 className="text-2xl font-semibold">Meeting</h1><p className="mt-3">Pick an applicant in the top bar</p></Shell>;
  }
  const meeting = db.meetings.find((m) => m.id === meetingId && m.applicantId === applicant.id);
  const back = <Link href="/applicant/meetings" className="text-blue-900 underline">Back to meetings</Link>;
  if (!meeting) {
    return <Shell><h1 className="text-2xl font-semibold">Meeting not found</h1><p className="mt-3">{back}</p></Shell>;
  }
  const company = db.companies.find((c) => c.id === meeting.companyId);
  const name = company?.name ?? meeting.companyId;
  if (meeting.status !== "booked") {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold">Meeting with {name}</h1>
        <p className="mt-3">Accept this request on the meetings page first.</p>
        <p className="mt-3">{back}</p>
      </Shell>
    );
  }
  const card = buildCard(db, meeting.companyId, applicant.id);
  return (
    <Shell>
      <p>{back}</p>
      <h1 className="mt-2 text-2xl font-semibold">Meeting with {name}</h1>
      <p className="mt-2 text-neutral-800">This is the card {name} sees. Your name is shown to them now.</p>
      <div className="mt-3"><EvidenceCard card={card} /></div>
      <Result db={db} meeting={meeting} applicantEmail={applicant.contact.email} />
    </Shell>
  );
}
