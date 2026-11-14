import { notFound } from "next/navigation";
import { buildCard } from "@/lib/domain/cards";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";

const PRINT_CSS = `
body > nav, body > footer { display: none; }
@media print { main { padding: 0 !important; } a { color: inherit; text-decoration: none; } }
`;

export default async function PrintCardPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const [session, db, { meetingId }] = await Promise.all([getSession(), readDb(), params]);
  const meeting = db.meetings.find((m) => m.id === meetingId && m.companyId === session.companyId);
  if (!meeting) notFound();
  const card = buildCard(db, meeting.companyId, meeting.applicantId);
  const company = db.companies.find((c) => c.id === meeting.companyId);

  return (
    <main className="mx-auto max-w-3xl bg-white p-6 text-black">
      <style>{PRINT_CSS}</style>
      <h1 className="text-2xl font-semibold">{card.label}</h1>
      <p className="mt-1 text-neutral-800">Meeting card for {company?.name ?? "your company"}</p>
      <ol className="mt-6 space-y-6">
        {card.slots.map((slot) => (
          <li key={slot.requirement.id} className="break-inside-avoid">
            <h2 className="text-lg font-semibold">{slot.requirement.text}</h2>
            <p className="mt-1">In practice: {slot.requirement.inPractice}</p>
            {slot.examples.length === 0 ? (
              <p className="mt-2">No example yet</p>
            ) : (
              slot.examples.map((ex) => (
                <div key={ex.story.id} className="mt-2">
                  <p className="font-medium">{ex.story.title}</p>
                  {ex.story.languageLabel ? <p className="text-sm">{ex.story.languageLabel}</p> : null}
                  <p>{ex.story.body}</p>
                </div>
              ))
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
