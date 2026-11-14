import { formatEventDate, formatWindow } from "@/lib/domain/eventFormat";
import { getSession } from "@/lib/session";
import { readDb } from "@/lib/store/db";

const ICONS = {
  date: "M3 5.5h10M5 2.5v2M11 2.5v2M3.5 4h9a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5Z",
  time: "M8 4.5V8l2.5 1.5M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0Z",
  place: "M8 14s4.5-4.2 4.5-7.5a4.5 4.5 0 0 0-9 0C3.5 9.8 8 14 8 14Zm0-6a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
} as const;

function ChipIcon({ name }: { name: keyof typeof ICONS }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false" className="shrink-0">
      <path d={ICONS[name]} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Context line under the header: which event every page is showing, as a row of chips. */
export async function EventBanner() {
  const [session, db] = await Promise.all([getSession(), readDb()]);
  const event = db.events.find((e) => e.id === session.eventId);
  if (!event) return null;

  return (
    <div data-app-chrome>
      <p className="shell flex flex-wrap items-center gap-2 pt-4">
        <span className="chip chip-ticket tone tone-sun">{event.name}</span>
        <span className="chip">
          <ChipIcon name="date" />
          {formatEventDate(event.date)}
        </span>
        <span className="chip">
          <ChipIcon name="time" />
          {formatWindow(event)}
        </span>
        <span className="chip">
          <ChipIcon name="place" />
          {event.location}
        </span>
      </p>
    </div>
  );
}
