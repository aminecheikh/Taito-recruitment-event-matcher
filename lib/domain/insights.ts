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
