import { coverage } from "./cards";
import type { Db, Result } from "./types";

export function signalsLeft(db: Db, eventId: string, applicantId: string): number {
  const allowed = db.events.find((e) => e.id === eventId)?.signalsPerApplicant ?? 0;
  const spent = db.signals.filter((s) => s.eventId === eventId && s.applicantId === applicantId).length;
  return Math.max(0, allowed - spent);
}

export function spendSignal(db: Db, eventId: string, applicantId: string, companyId: string): Result<Db> {
  if (!db.events.some((e) => e.id === eventId)) return { ok: false, error: "not-found" };
  if (signalsLeft(db, eventId, applicantId) <= 0) return { ok: false, error: "no-signals-left" };
  const duplicate = db.signals.some(
    (s) => s.eventId === eventId && s.applicantId === applicantId && s.companyId === companyId,
  );
  if (duplicate) return { ok: false, error: "already-signalled" };
  if (coverage(db, companyId, applicantId).covered < 1) return { ok: false, error: "no-accepted-example" };
  return { ok: true, value: { ...db, signals: [...db.signals, { eventId, applicantId, companyId }] } };
}
