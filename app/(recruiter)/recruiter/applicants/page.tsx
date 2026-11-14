import { PageHeader } from "@/app/components/PageHeader";
import { buildCard, coverage, filterByCoverage } from "@/lib/domain/cards";
import { companyCalendar, companyOpenSlots } from "@/lib/domain/calendar";
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
      <main className="page">
        <PageHeader title="Who signalled us">Pick a company in the top bar.</PageHeader>
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

  const left = companyOpenSlots(db, session.eventId, company.id);
  const slotTotal = companyCalendar(db, session.eventId, company.id).total;
  const requested = new Set(
    db.meetings
      .filter((m) => m.eventId === session.eventId && m.companyId === company.id)
      .map((m) => m.applicantId),
  );
  const options = Array.from({ length: total + 1 }, (_, i) => total - i);

  return (
    <main className="page page-wide">
      <PageHeader
        eyebrow={company.name}
        title={<>Who signalled {company.name}</>}
        actions={
          <p className="rounded-xl border border-line bg-surface px-4 py-3 text-right">
            <span className="block font-serif text-3xl font-semibold leading-none">
              {left}<span className="text-lg text-muted"> / {slotTotal}</span>
            </span>
            <span className="hint mt-1 block">{left} of {slotTotal} meeting slots open</span>
          </p>
        }
      >
        Anonymous evidence cards, in alphabetical order. No names, no photos, no AI score. You choose who to meet.
      </PageHeader>
      <form method="get" className="panel mt-8 flex flex-wrap items-center gap-3">
        <label htmlFor="min" className="label">Coverage</label>
        <select
          id="min"
          name="min"
          defaultValue={String(min)}
          className="field field-inline"
        >
          {options.map((n) => (
            <option key={n} value={n}>
              {optionLabel(n, total)}
            </option>
          ))}
        </select>
        <button type="submit" className="btn">
          Apply
        </button>
        <span className="hint ml-auto">{shown.length} shown</span>
        <RefreshButton />
      </form>
      {shown.length === 0 ? (
        <p className="empty-slot mt-6">No applicants match. Try a lower coverage.</p>
      ) : (
        <ul className="mt-6 space-y-6">
          {shown.map((id) => (
            <li key={id}>
              <ScoredCard
                coverageText={`Covers ${coverage(db, company.id, id).covered} of ${total}`}
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
