import { formatEventDate, formatWindow } from "@/lib/domain/eventFormat";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";

/** Quiet context line under the header: which event every page is showing. */
export async function EventBanner() {
  const [session, db] = await Promise.all([getSession(), readDb()]);
  const event = db.events.find((e) => e.id === session.eventId);
  if (!event) return null;

  return (
    <div data-app-chrome className="border-b border-line bg-surface text-sm text-muted">
      <p className="shell flex flex-wrap items-center gap-x-2 gap-y-0.5 py-2">
        <span className="font-semibold text-ink">{event.name}</span>
        <span aria-hidden="true">·</span>
        <span>{formatEventDate(event.date)}</span>
        <span aria-hidden="true">·</span>
        <span>{formatWindow(event)}</span>
        <span aria-hidden="true">·</span>
        <span>{event.location}</span>
      </p>
    </div>
  );
}
