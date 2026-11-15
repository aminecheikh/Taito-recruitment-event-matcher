import { companiesAt } from "./attendance";
import { coreRequirements } from "./requirements";
import type { Db, Reminder, Result } from "./types";

export type CompanyRef = { companyId: string; name: string };

function byName(a: CompanyRef, b: CompanyRef): number {
  return a.name.localeCompare(b.name);
}

/** Companies at the event that have not picked any core requirement yet. Alphabetical. */
export function companiesWithoutCore(db: Db, eventId: string): CompanyRef[] {
  const attending = new Set(companiesAt(db, eventId));
  return db.companies
    .filter((c) => attending.has(c.id) && coreRequirements(db, c.id).length === 0)
    .map((c) => ({ companyId: c.id, name: c.name }))
    .sort(byName);
}

/** Companies that do not attend the event. Alphabetical. */
export function companiesNotAtEvent(db: Db, eventId: string): CompanyRef[] {
  const attending = new Set(companiesAt(db, eventId));
  return db.companies
    .filter((c) => !attending.has(c.id))
    .map((c) => ({ companyId: c.id, name: c.name }))
    .sort(byName);
}

export function sendReminder(
  db: Db,
  input: Pick<Reminder, "eventId" | "companyId" | "kind">,
  now: string,
): Result<Db> {
  const duplicate = db.reminders.some(
    (r) => r.eventId === input.eventId && r.companyId === input.companyId && r.kind === input.kind,
  );
  if (duplicate) return { ok: false, error: "already-sent" };
  const reminder: Reminder = {
    id: `reminder-${input.eventId}-${input.companyId}-${input.kind}`,
    ...input,
    sentAt: now,
  };
  return { ok: true, value: { ...db, reminders: [...db.reminders, reminder] } };
}

/** Reminders the company has not yet acted on; acting resolves them. */
export function openReminders(db: Db, companyId: string): Reminder[] {
  return db.reminders.filter((r) => {
    if (r.companyId !== companyId) return false;
    if (r.kind === "set-requirements") return coreRequirements(db, companyId).length === 0;
    return !companiesAt(db, r.eventId).includes(companyId);
  });
}

export function joinEvent(db: Db, companyId: string, eventId: string): Result<Db> {
  if (companiesAt(db, eventId).includes(companyId)) return { ok: false, error: "already-attending" };
  return { ok: true, value: { ...db, companyEvents: [...db.companyEvents, { companyId, eventId }] } };
}
