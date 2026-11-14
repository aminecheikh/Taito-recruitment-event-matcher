import { cookies } from "next/headers";

export type Role = "recruiter" | "applicant" | "staff";
export type Session = { role: Role; companyId: string; applicantId: string; eventId: string };

export const SESSION_COOKIE = "session";
export const ROLES: readonly Role[] = ["recruiter", "applicant", "staff"];

export const DEFAULT_SESSION: Session = {
  role: "recruiter",
  companyId: "company-01",
  applicantId: "talent-017",
  eventId: "event-01",
};

/** Merges a stored cookie value over the defaults, ignoring anything malformed. */
export function parseSession(raw: string | undefined): Session {
  if (!raw) return DEFAULT_SESSION;
  try {
    const data = JSON.parse(raw) as Partial<Session>;
    const pick = (key: "companyId" | "applicantId" | "eventId") =>
      typeof data[key] === "string" && data[key] ? data[key] : DEFAULT_SESSION[key];
    return {
      role: ROLES.includes(data.role as Role) ? (data.role as Role) : DEFAULT_SESSION.role,
      companyId: pick("companyId"),
      applicantId: pick("applicantId"),
      eventId: pick("eventId"),
    };
  } catch {
    return DEFAULT_SESSION;
  }
}

export async function getSession(): Promise<Session> {
  const store = await cookies();
  return parseSession(store.get(SESSION_COOKIE)?.value);
}
