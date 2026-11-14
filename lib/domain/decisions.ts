import { coreRequirements } from "./requirements";
import type { Db, Decision, Result, Share } from "./types";

export type Reveal = { status: "waiting" } | { status: "revealed"; match: boolean; feedback?: Record<string, string> };

function hasFeedbackForEveryCore(db: Db, companyId: string, feedback: Decision["feedback"]): boolean {
  return coreRequirements(db, companyId).every((r) => (feedback?.[r.id] ?? "").trim() !== "");
}

export function recordDecision(db: Db, decision: Decision): Result<Db> {
  const meeting = db.meetings.find((m) => m.id === decision.meetingId);
  if (!meeting) return { ok: false, error: "not-found" };
  if (meeting.status !== "booked") return { ok: false, error: "not-booked" };
  const decided = db.decisions.some((d) => d.meetingId === decision.meetingId && d.side === decision.side);
  if (decided) return { ok: false, error: "already-decided" };
  const needsFeedback = decision.side === "company" && !decision.continue;
  if (needsFeedback && !hasFeedbackForEveryCore(db, meeting.companyId, decision.feedback)) {
    return { ok: false, error: "feedback-missing" };
  }
  return { ok: true, value: { ...db, decisions: [...db.decisions, decision] } };
}

export function revealDecisions(db: Db, meetingId: string): Reveal {
  const applicant = db.decisions.find((d) => d.meetingId === meetingId && d.side === "applicant");
  const company = db.decisions.find((d) => d.meetingId === meetingId && d.side === "company");
  if (!applicant || !company) return { status: "waiting" };
  const match = applicant.continue && company.continue;
  if (match || !company.feedback) return { status: "revealed", match };
  return { status: "revealed", match, feedback: company.feedback };
}

export function saveShare(
  db: Db,
  meetingId: string,
  part: Share["applicant"] | Share["company"],
  side: "applicant" | "company",
): Result<Db> {
  if (!db.meetings.some((m) => m.id === meetingId)) return { ok: false, error: "not-found" };
  const reveal = revealDecisions(db, meetingId);
  if (reveal.status !== "revealed" || !reveal.match) return { ok: false, error: "not-a-match" };
  const existing = db.shares.find((s) => s.meetingId === meetingId);
  const updated = { ...(existing ?? { meetingId }), [side]: part } as Share;
  const shares = existing
    ? db.shares.map((s) => (s.meetingId === meetingId ? updated : s))
    : [...db.shares, updated];
  return { ok: true, value: { ...db, shares } };
}
