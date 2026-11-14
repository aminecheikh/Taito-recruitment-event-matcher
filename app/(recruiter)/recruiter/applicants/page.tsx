import { buildCard, coverage, filterByCoverage } from "@/lib/domain/cards";
import { slotsLeft } from "@/lib/domain/meetings";
import { coreRequirements } from "@/lib/domain/requirements";
import type { Db } from "@/lib/domain/types";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { RefreshButton, ScoredCard } from "./ScoreInputs";

type SearchParams = Promise<{ min?: string | string[] }>;

function optionLabel(min: number, total: number): string {
  if (min >= total) return `Covers all ${total}`;
  if (min <= 0) return "Show everyone";
  return `At least ${min}`;
}

function parseMin(raw: string | string[] | undefined, total: number): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(value) && value >= 0 && value <= total ? value : 0;
}

function scoresFor(db: Db, companyId: string, applicantId: string): Record<string, number> {
  const mine = db.scores.filter((s) => s.companyId === companyId && s.applicantId === applicantId && s.stage === "card");
  return Object.fromEntries(mine.map((s) => [s.requirementId, s.value]));
}

export default async function ApplicantsPage({ searchParams }: { searchParams: SearchParams }) {
  const [session, db, params] = await Promise.all([getSession(), readDb(), searchParams]);
  const company = db.companies.find((c) => c.id === session.companyId);

  if (!company) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="text-2xl font-semibold">Who signalled us</h1>
        <p className="mt-3">Pick a company in the top bar.</p>
      </main>
    );
  }

  const total = coreRequirements(db, company.id).length;
  const min = parseMin(params.min, total);
  const signalled = db.signals
    .filter((s) => s.eventId === session.eventId && s.companyId === company.id)
    .map((s) => s.applicantId);
  const pseudonym = (id: string) => db.applicants.find((a) => a.id === id)?.pseudonym ?? id;
  const shown = filterByCoverage(db, company.id, signalled, min).sort((a, b) =>
    pseudonym(a).localeCompare(pseudonym(b)),
  );

  const left = slotsLeft(db, session.eventId, company.id);
  const slotTotal =
    db.companyEvents.find((c) => c.eventId === session.eventId && c.companyId === company.id)?.meetingSlots ?? 0;
  const requested = new Set(
    db.meetings
      .filter((m) => m.eventId === session.eventId && m.companyId === company.id)
      .map((m) => m.applicantId),
  );
  const options = Array.from({ length: total + 1 }, (_, i) => total - i);

  return (
    <main className="mx-auto max-w-3xl p-4">
      <h1 className="text-2xl font-semibold">Who signalled {company.name}</h1>
      <p className="mt-2 font-medium">
        {left} of {slotTotal} meeting slots left
      </p>
      <form method="get" className="mt-4 flex flex-wrap items-center gap-3">
        <label htmlFor="min">Coverage</label>
        <select
          id="min"
          name="min"
          defaultValue={String(min)}
          className="min-h-11 rounded border border-neutral-700 bg-white px-2 text-neutral-900"
        >
          {options.map((n) => (
            <option key={n} value={n}>
              {optionLabel(n, total)}
            </option>
          ))}
        </select>
        <button type="submit" className="min-h-11 rounded border border-neutral-700 bg-white px-3 text-sm text-neutral-900">
          Apply
        </button>
        <RefreshButton />
      </form>
      {shown.length === 0 ? (
        <p className="mt-6">No applicants match. Try a lower coverage.</p>
      ) : (
        <ul className="mt-6 space-y-6">
          {shown.map((id) => (
            <li key={id}>
              <p className="mb-1 text-sm text-neutral-700">
                Covers {coverage(db, company.id, id).covered} of {total}
              </p>
              <ScoredCard
                card={buildCard(db, company.id, id)}
                initialScores={scoresFor(db, company.id, id)}
                meetingRequested={requested.has(id)}
                slotsLeft={left}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
