import type { Event } from "./types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** "Sat 5 Dec" from "YYYY-MM-DD". Built from the parts in UTC, so the viewer's timezone never shifts the day. */
export function formatShortDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday} ${day} ${MONTHS[month - 1]}`;
}

/** "Sat 5 Dec 2026" from "YYYY-MM-DD". */
export function formatEventDate(date: string): string {
  return `${formatShortDate(date)} ${date.slice(0, 4)}`;
}

/** "14:00–18:00" (en dash). */
export function formatWindow(event: Pick<Event, "startTime" | "endTime">): string {
  return `${event.startTime}–${event.endTime}`;
}
