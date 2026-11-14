import type { Db } from "./types";

/** Ids of companies attending an event, in seed order. */
export function companiesAt(db: Db, eventId: string): string[] {
  return db.companyEvents.filter((ce) => ce.eventId === eventId).map((ce) => ce.companyId);
}

/** Ids of applicants registered for an event, in seed order. */
export function applicantsAt(db: Db, eventId: string): string[] {
  return db.applicantEvents.filter((ae) => ae.eventId === eventId).map((ae) => ae.applicantId);
}
