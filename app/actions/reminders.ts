"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { joinEvent, sendReminder } from "@/lib/domain/reminders";
import { getSession } from "@/lib/session";
import { updateDb } from "@/lib/store/db";

export type ReminderStatus = { ok: true } | { ok: false; error: string; alreadySent?: true };

const KindSchema = z.enum(["set-requirements", "join-event"]);
const IdSchema = z.string().min(1).max(100);

/** Staff only. Returns a status, never database contents. */
export async function sendReminderAction(companyId: string, kind: string): Promise<ReminderStatus> {
  const parsed = z.object({ companyId: IdSchema, kind: KindSchema }).safeParse({ companyId, kind });
  if (!parsed.success) return { ok: false, error: "That reminder could not be read." };
  const session = await getSession();
  if (session.role !== "staff") return { ok: false, error: "Only event staff can send reminders." };

  const known = await updateDb((db) =>
    db.companies.some((c) => c.id === parsed.data.companyId) && db.events.some((e) => e.id === session.eventId)
      ? sendReminder(db, { eventId: session.eventId, ...parsed.data }, new Date().toISOString())
      : { ok: false, error: "unknown-company" },
  );
  if (!known.ok) {
    if (known.error === "already-sent") return { ok: false, error: "Already reminded.", alreadySent: true };
    return { ok: false, error: "Company not found." };
  }
  revalidatePath("/staff");
  revalidatePath("/recruiter", "layout");
  return { ok: true };
}

/** Recruiter only, for their own company. */
export async function joinEventAction(eventId: string): Promise<ReminderStatus> {
  const parsed = IdSchema.safeParse(eventId);
  if (!parsed.success) return { ok: false, error: "That event could not be read." };
  const session = await getSession();
  if (session.role !== "recruiter") return { ok: false, error: "Only recruiters can join an event." };

  const result = await updateDb((db) =>
    db.events.some((e) => e.id === parsed.data)
      ? joinEvent(db, session.companyId, parsed.data)
      : { ok: false, error: "unknown-event" },
  );
  if (!result.ok) {
    // One generic message for unknown and uninvited events.
    return { ok: false, error: result.error === "already-attending" ? "Already attending." : "You have no invitation to that event." };
  }
  revalidatePath("/staff");
  revalidatePath("/recruiter", "layout");
  return { ok: true };
}
