"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { spendSignal } from "@/lib/domain/signals";
import { getSession } from "@/lib/session";
import { updateDb } from "@/lib/store/db";

export type SignalStatus = { ok: true } | { ok: false; error: string };

const SIGNALS_PATH = "/applicant/signals";

/** Returns a status only, never database contents. */
export async function signalCompany(companyId: string): Promise<SignalStatus> {
  const session = await getSession();
  const result = await updateDb((db) => {
    const known = db.applicants.some((a) => a.id === session.applicantId);
    const atEvent = db.companyEvents.some(
      (ce) => ce.companyId === companyId && ce.eventId === session.eventId,
    );
    if (!known || !atEvent) return { ok: false, error: "not-found" } as const;
    return spendSignal(db, session.eventId, session.applicantId, companyId);
  });
  if (!result.ok) return { ok: false, error: result.error }; // error codes; the page maps them to text
  revalidatePath(SIGNALS_PATH);
  return { ok: true };
}

/** Form entry point: works without client JS; errors come back as a query key the page maps to text. */
export async function signalCompanyForm(formData: FormData): Promise<void> {
  const companyId = String(formData.get("companyId") ?? "");
  const status = await signalCompany(companyId);
  redirect(status.ok ? SIGNALS_PATH : `${SIGNALS_PATH}?error=${encodeURIComponent(status.error)}`);
}
