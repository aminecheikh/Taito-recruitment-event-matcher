import { notFound } from "next/navigation";
import { buildCard } from "@/lib/domain/cards";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";

const PRINT_CSS = `
[data-app-chrome] { display: none; }
body { background: #fff; color-scheme: light; }
@media print { main { padding: 0 !important; } a { color: inherit; text-decoration: none; } }
`;

export default async function PrintCardPage({ params }: { params: Promise<{ meetingId: string }> }) {
  const [session, db, { meetingId }] = await Promise.all([getSession(), readDb(), params]);
  const meeting = db.meetings.find((m) => m.id === meetingId && m.companyId === session.companyId);
  if (!meeting) notFound();
  const card = buildCard(db, meeting.companyId, meeting.applicantId);
  const company = db.companies.find((c) => c.id === meeting.companyId);

  return (
    <main className="mx-auto max-w-3xl bg-white p-8 text-black">
      <style>{PRINT_CSS}</style>
      <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600">Meeting card</p>
      <h1 className="mt-1 font-serif text-3xl font-semibold">{card.label}</h1>
      <p className="mt-1 text-neutral-700">Meeting card for {company?.name ?? "your company"}</p>
      <ol className="mt-8 divide-y divide-neutral-300 border-t-2 border-black">
        {card.slots.map((slot) => (
          <li key={slot.requirement.id} className="break-inside-avoid py-5">
            <h2 className="font-serif text-xl font-semibold">{slot.requirement.text}</h2>
            <p className="mt-1 text-sm text-neutral-700">In practice: {slot.requirement.inPractice}</p>
            {slot.example === null ? (
              <p className="mt-3 border border-dashed border-neutral-500 px-3 py-2 text-neutral-700">No example yet</p>
            ) : (
              <div className="mt-3 border-l-2 border-black pl-4">
                {slot.example.entry.languageLabel ? <p className="text-sm italic">{slot.example.entry.languageLabel}</p> : null}
                <p>{slot.example.entry.body}</p>
              </div>
            )}
          </li>
        ))}
      </ol>
    </main>
  );
}
