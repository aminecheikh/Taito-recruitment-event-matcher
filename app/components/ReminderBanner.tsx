import { formatEventDate } from "@/lib/domain/eventFormat";
import { openReminders } from "@/lib/domain/reminders";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";
import { JoinEventButton } from "./JoinEventButton";

/** Shows open staff reminders to the signed-in recruiter's company. */
export async function ReminderBanner() {
  const [session, db] = await Promise.all([getSession(), readDb()]);
  if (session.role !== "recruiter") return null;
  const open = openReminders(db, session.companyId);
  if (open.length === 0) return null;

  return (
    <div className="mt-6 space-y-3">
      {open.map((reminder) => {
        const event = db.events.find((e) => e.id === reminder.eventId);
        const label = event ? `${event.name}, ${formatEventDate(event.date)}` : "the event";
        return (
          <div key={reminder.id} className="panel" role="status">
            <p className="font-semibold">
              {reminder.kind === "set-requirements"
                ? `Event staff reminded you to set your core requirements for ${label}.`
                : `Event staff invited you to ${label}.`}
            </p>
            <p className="hint mt-1">In a real deployment this would also be an email.</p>
            {reminder.kind === "join-event" ? (
              <div className="mt-3">
                <JoinEventButton eventId={reminder.eventId} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
