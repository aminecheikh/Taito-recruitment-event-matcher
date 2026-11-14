"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession, parseSession, SESSION_COOKIE, type Session } from "@/lib/session";

export async function setSession(patch: Partial<Session>): Promise<void> {
  const next = parseSession(JSON.stringify({ ...(await getSession()), ...patch }));
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(next), { path: "/", sameSite: "lax", httpOnly: true });
  revalidatePath("/", "layout");
}
