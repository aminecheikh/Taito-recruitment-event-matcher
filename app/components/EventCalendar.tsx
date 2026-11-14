import Link from "next/link";
import type { Calendar } from "@/lib/domain/calendar";
import type { Event, Meeting } from "@/lib/domain/types";

type Props = {
  event: Event;
  calendar: Calendar;
  /** Text shown for a booked meeting: the company name for applicants, the applicant name for recruiters. */
  nameFor: (meeting: Meeting) => string;
  hrefFor: (meeting: Meeting) => string;
};

const EN_DASH = "–";

export function EventCalendar({ event, calendar, nameFor, hrefFor }: Props) {
  return (
    <section aria-labelledby="event-calendar-title" className="cal">
      <h2 id="event-calendar-title" className="h2">Your calendar for {event.name}</h2>
      <p className="mt-1 text-muted">
        {event.startTime}{EN_DASH}{event.endTime} · {calendar.booked} of {calendar.total} slots booked
      </p>
      {calendar.full ? (
        <p className="notice mt-3">Your calendar for this event is full. That is your maximum for this event.</p>
      ) : null}
      <ol className="cal-list mt-3">
        {calendar.slots.map((slot) => (
          <li key={slot.start} className={slot.meeting ? "cal-row cal-row-booked" : "cal-row"}>
            <time className="cal-time">{slot.start}{EN_DASH}{slot.end}</time>
            {slot.meeting ? (
              <span>
                <span className="cal-state">Booked</span>{" "}
                <Link href={hrefFor(slot.meeting)} className="link">{nameFor(slot.meeting)}</Link>
              </span>
            ) : (
              <span className="cal-state text-muted">Open</span>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
