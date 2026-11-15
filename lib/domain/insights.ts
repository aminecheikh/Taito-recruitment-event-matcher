import { applicantsAt, companiesAt } from "./attendance";
import { coverage } from "./cards";
import { companyOpenSlots } from "./calendar";
import { coreRequirements } from "./requirements";
import type { Db } from "./types";

export type PoolSummary = { signalled: number; coverAll: number; coreCount: number; openSlots: number };

/** Counts only: who signalled a company, how many cover every core requirement, and slots left. */
export function poolSummary(db: Db, eventId: string, companyId: string): PoolSummary {
  const coreCount = coreRequirements(db, companyId).length;
  const signalled = db.signals.filter((s) => s.eventId === eventId && s.companyId === companyId);
  const coverAll =
    coreCount === 0
      ? 0
      : signalled.filter((s) => coverage(db, companyId, s.applicantId).covered === coreCount).length;
  return { signalled: signalled.length, coverAll, coreCount, openSlots: companyOpenSlots(db, eventId, companyId) };
}

/** Below this many signals in a group, no rate is shown. */
export const MIN_GROUP_SIZE = 5;

export type DemandRow = { companyName: string; requirementText: string; rank: number; withExample: number; registered: number };

/** Per core requirement at the event: how many registered applicants have an example. Thinnest supply first. Requirements, not people. */
export function demandReport(db: Db, eventId: string): DemandRow[] {
  const registered = new Set(applicantsAt(db, eventId));
  const rows = companiesAt(db, eventId).flatMap((companyId) => {
    const companyName = db.companies.find((c) => c.id === companyId)?.name ?? companyId;
    return coreRequirements(db, companyId).map((req): DemandRow => {
      const supplied = new Set(
        db.answers
          .filter((a) => a.requirementId === req.id && registered.has(a.applicantId))
          .filter((a) => db.entries.some((e) => e.id === a.entryId && e.applicantId === a.applicantId))
          .map((a) => a.applicantId),
      );
      return { companyName, requirementText: req.text, rank: req.rank, withExample: supplied.size, registered: registered.size };
    });
  });
  return [...rows].sort(
    (a, b) => a.withExample - b.withExample || a.companyName.localeCompare(b.companyName) || a.rank - b.rank,
  );
}

export type ProcessGroup = { label: "Used AI language help" | "Own wording only"; signals: number; meetingsRequested: number };

function usedLanguageHelp(db: Db, companyId: string, applicantId: string): boolean {
  const coreIds = new Set(coreRequirements(db, companyId).map((r) => r.id));
  return db.answers
    .filter((a) => a.applicantId === applicantId && coreIds.has(a.requirementId))
    .some((a) => db.entries.some((e) => e.id === a.entryId && e.applicantId === applicantId && Boolean(e.languageLabel)));
}

/** Do signals with AI-language-labelled examples lead to fewer meeting requests? Counts per signal; no identity data. */
export function processCheck(db: Db, eventId: string): { groups: ProcessGroup[]; comparable: boolean } {
  const signals = db.signals.filter((s) => s.eventId === eventId);
  const tally = (used: boolean): Omit<ProcessGroup, "label"> => {
    const inGroup = signals.filter((s) => usedLanguageHelp(db, s.companyId, s.applicantId) === used);
    const meetingsRequested = inGroup.filter((s) =>
      db.meetings.some((m) => m.eventId === eventId && m.companyId === s.companyId && m.applicantId === s.applicantId),
    ).length;
    return { signals: inGroup.length, meetingsRequested };
  };
  const groups: ProcessGroup[] = [
    { label: "Used AI language help", ...tally(true) },
    { label: "Own wording only", ...tally(false) },
  ];
  return { groups, comparable: groups.every((g) => g.signals >= MIN_GROUP_SIZE) };
}
