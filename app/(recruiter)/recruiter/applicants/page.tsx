import Link from "next/link";
import { PageHeader } from "@/app/components/PageHeader";
import { isMarked, recruiterList } from "@/lib/domain/applicantList";
import { ReminderBanner } from "@/app/components/ReminderBanner";
import { buildCard, coverage } from "@/lib/domain/cards";
import { companyCalendar, companyOpenSlots } from "@/lib/domain/calendar";
import { coreRequirements } from "@/lib/domain/requirements";
import type { Db } from "@/lib/domain/types";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { shortlist } from "@/lib/domain/scores";
import { ApplicantList, type ApplicantRow } from "./ApplicantList";
import { RefreshButton } from "./ScoreInputs";
import { ShortlistTable } from "./ShortlistTable";
import { CoverageSelect } from "./CoverageSelect";
import { PoolSummaryStrip } from "./PoolSummaryStrip";
import { poolSummary } from "@/lib/domain/insights";

type Param = string | string[] | undefined;
type SearchParams = Promise<{ min?: Param; view?: Param; minw?: Param; marked?: Param }>;

const first = (raw: Param) => (Array.isArray(raw) ? raw[0] : raw);

function parseMinWeighted(raw: Param): number | undefined {
  const text = first(raw);
  if (text === undefined || text.trim() === "") return undefined;
  const value = Number(text);
  return Number.isInteger(value) && value >= 0 && value <= 100 ? value : undefined;
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
  const minWeighted = parseMinWeighted(params.minw);
  const tableView = first(params.view) === "table";
  const result = shortlist(db, company.id, signalled, { minCovered: min, minWeighted });
  const shown = [...result.scored, ...result.notScored]
    .map((r) => r.applicantId)
    .sort((a, b) => pseudonym(a).localeCompare(pseudonym(b)));
  const coreIds = coreRequirements(db, company.id).map((r) => r.id);
  const coreTexts = coreRequirements(db, company.id).map((r) => r.text);
  // Marked applicants stay on the list; the tabs (cards view) show just them.
  const markedOnly = !tableView && first(params.marked) === "1";
  const queryFor = (view: string, marked = false) => {
    const q = new URLSearchParams({ view });
    if (min > 0) q.set("min", String(min));
    if (minWeighted !== undefined) q.set("minw", String(minWeighted));
    if (marked) q.set("marked", "1");
    return `?${q.toString()}`;
  };

  // Cards view: who signalled, minus invited applicants (they are on Meetings), then the same filters.
  const listFilter = { minCovered: min, markedOnly, minWeighted };
  const cardIds = recruiterList(db, session.eventId, company.id, listFilter);
  const rows: ApplicantRow[] = cardIds.map((id) => ({
    id,
    card: buildCard(db, company.id, id),
    initialScores: scoresFor(db, company.id, id),
    coverageText: `Covers ${coverage(db, company.id, id).covered} of ${total}`,
    marked: isMarked(db, session.eventId, company.id, id),
  }));
  const allCount = recruiterList(db, session.eventId, company.id, { minCovered: 0, markedOnly: false }).length;
  const markedCount = recruiterList(db, session.eventId, company.id, { minCovered: 0, markedOnly: true }).length;
  const views = [
    { label: `All applicants (${allCount})`, href: queryFor("cards"), current: !markedOnly },
    { label: `Marked for later (${markedCount})`, href: queryFor("cards", true), current: markedOnly },
  ];

  const left = companyOpenSlots(db, session.eventId, company.id);
  const slotTotal = companyCalendar(db, session.eventId, company.id).total;

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
        {tableView
          ? "Your own scores, highest first. People you haven't scored stay listed. No AI score."
          : "Anonymous evidence cards, in alphabetical order. No names, no photos, no AI score. Invited applicants move to Meetings."}{" "}
        You choose who to meet.
      </PageHeader>
      <ReminderBanner />
      <PoolSummaryStrip summary={poolSummary(db, session.eventId, company.id)} />
      <form method="get" className="panel mt-8 flex flex-wrap items-center gap-3">
        <input type="hidden" name="view" value={tableView ? "table" : "cards"} />
        {markedOnly && <input type="hidden" name="marked" value="1" />}
        <label htmlFor="min" className="label">Has examples for</label>
        <CoverageSelect min={min} total={total} />
        <label htmlFor="minw" className="label">Weighted score at least</label>
        <input
          id="minw"
          name="minw"
          type="number"
          min={0}
          max={100}
          defaultValue={minWeighted ?? ""}
          className="field field-inline w-24"
        />
        <button type="submit" className="btn">
          Apply
        </button>
        <span className="hint ml-auto">{tableView ? shown.length : cardIds.length} shown</span>
        <RefreshButton />
      </form>
      <nav aria-label="View" className="mt-4 flex gap-2">
        <Link href={queryFor("table")} className={tableView ? "btn btn-primary btn-sm" : "btn btn-sm"} aria-current={tableView ? "page" : undefined}>Table</Link>
        <Link href={queryFor("cards")} className={tableView ? "btn btn-sm" : "btn btn-primary btn-sm"} aria-current={tableView ? undefined : "page"}>Cards</Link>
      </nav>
      {tableView ? (
        shown.length === 0 ? (
          <p className="empty-slot mt-6">No applicants have examples for that many core requirements. Pick a lower number.</p>
        ) : (
          <ShortlistTable
            scored={result.scored}
            notScored={result.notScored}
            requirementIds={coreIds}
            requirementTexts={coreTexts}
            cardsHref={queryFor("cards")}
          />
        )
      ) : (
        <>
          <nav
            aria-label="Which applicants"
            className="seg mt-4"
            style={{ "--n": views.length, "--i": markedOnly ? 1 : 0 } as React.CSSProperties}
          >
            <span aria-hidden="true" className="seg-thumb" />
            {views.map((view) => (
              <Link
                key={view.label}
                href={view.href}
                aria-current={view.current ? "page" : undefined}
                className={`seg-btn inline-flex items-center justify-center ${view.current ? "!text-ink" : ""}`}
              >
                {view.label}
              </Link>
            ))}
          </nav>
          {/* Keyed by the filters so changing them starts with an empty selection. */}
          <ApplicantList
            key={`${min}-${markedOnly}-${minWeighted ?? ""}`}
            rows={rows}
            slotsLeft={left}
            minCovered={min}
            markedOnly={markedOnly}
            minWeighted={minWeighted}
          />
        </>
      )}
    </main>
  );
}
