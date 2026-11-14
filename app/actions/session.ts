"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession, parseSession, ROLES, SESSION_COOKIE, type Role, type Session } from "@/lib/session";
import { ROLE_HOME } from "@/lib/nav";

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
