"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, parseSession, ROLES, SESSION_COOKIE, type Role, type Session } from "@/lib/session";
import { ROLE_HOME } from "@/lib/nav";
import { readDb } from "@/lib/store/db";
import { applicantsAt, companiesAt } from "@/lib/domain/attendance";

export async function setSession(patch: Partial<Session>): Promise<void> {
  const next = parseSession(JSON.stringify({ ...(await getSession()), ...patch }));
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(next), { path: "/", sameSite: "lax", httpOnly: true });
  revalidatePath("/", "layout");
}

/** Switches role and lands on that role's first page. Used by the role bar and the home page. */
export async function enterRole(formData: FormData): Promise<void> {
  const role = String(formData.get("role"));
  if (!ROLES.includes(role as Role)) return;
  await setSession({ role: role as Role });
  redirect(ROLE_HOME[role as Role]);
}

/** Switches the event. Keeps the company and applicant if they attend it, otherwise moves to the first one that does. */
export async function pickEvent(formData: FormData): Promise<void> {
  const eventId = String(formData.get("eventId"));
  const [db, session] = await Promise.all([readDb(), getSession()]);
  if (!db.events.some((e) => e.id === eventId)) return;
  const companyIds = companiesAt(db, eventId);
  const applicantIds = applicantsAt(db, eventId);
  await setSession({
    eventId,
    companyId: companyIds.includes(session.companyId) ? session.companyId : (companyIds[0] ?? session.companyId),
    applicantId: applicantIds.includes(session.applicantId) ? session.applicantId : (applicantIds[0] ?? session.applicantId),
  });
}
