import { describe, expect, it } from "vitest";
import { formatEventDate, formatShortDate, formatWindow } from "./eventFormat";

describe("eventFormat", () => {
  it("test_formatEventDate_saturday_returnsWeekdayDayMonthYear", () => {
    expect(formatEventDate("2026-12-05")).toBe("Sat 5 Dec 2026");
  });
  it("test_formatEventDate_yearBoundary_noTimezoneShift", () => {
    expect(formatEventDate("2026-01-01")).toBe("Thu 1 Jan 2026");
    expect(formatEventDate("2026-12-31")).toBe("Thu 31 Dec 2026");
  });
  it("test_formatShortDate_anyDate_omitsYear", () => {
    expect(formatShortDate("2026-12-05")).toBe("Sat 5 Dec");
  });
  it("test_formatWindow_event_usesEnDash", () => {
    expect(formatWindow({ startTime: "14:00", endTime: "18:00" })).toBe("14:00–18:00");
  });
});
