import { revealDecisions } from "./decisions";
import type { Db, Result } from "./types";

export function setMovingHelp(db: Db, applicantId: string, on: boolean): Result<Db> {
  if (!db.applicants.some((a) => a.id === applicantId)) return { ok: false, error: "not-found" };
  return {
    ok: true,
    value: { ...db, applicants: db.applicants.map((a) => (a.id === applicantId ? { ...a, wantsMovingHelp: on } : a)) },
  };
}

/** The company learns of the opt-in only once both sides chose to continue. */
export function companySeesMovingHelp(db: Db, meetingId: string): boolean {
  const meeting = db.meetings.find((m) => m.id === meetingId);
  if (!meeting) return false;
  const reveal = revealDecisions(db, meetingId);
  if (reveal.status !== "revealed" || !reveal.match) return false;
  return db.applicants.find((a) => a.id === meeting.applicantId)?.wantsMovingHelp === true;
}
