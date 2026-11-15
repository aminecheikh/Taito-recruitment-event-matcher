import { describe, expect, it } from "vitest";
import { makeDb } from "./fixtures";
import {
  companiesNotAtEvent,
  companiesWithoutCore,
  joinEvent,
  openReminders,
  sendReminder,
} from "./reminders";
import type { Db } from "./types";

const NOW = "2026-11-15T10:00:00.000Z";

function withCompanies(): Db {
  const base = makeDb();
  return {
    ...base,
    companies: [
      ...base.companies,
      { id: "company-02", name: "Alpha Oy", sector: "IT", sizeRange: "1-10" },
      { id: "company-03", name: "Beta Oy", sector: "IT", sizeRange: "1-10" },
    ],
    events: [...base.events, { ...base.events[0], id: "event-02", name: "Other Event" }],
    companyEvents: [
      ...base.companyEvents,
      { companyId: "company-02", eventId: "event-01" },
      { companyId: "company-03", eventId: "event-02" },
    ],
  };
}

describe("reminders", () => {
  it("companiesWithoutCore_onlyAtThisEvent", () => {
    // company-01 has core, company-02 is at event-01 without core, company-03 is at another event.
    expect(companiesWithoutCore(withCompanies(), "event-01")).toEqual([
      { companyId: "company-02", name: "Alpha Oy" },
    ]);
  });

  it("companiesNotAtEvent_listsOthers", () => {
    expect(companiesNotAtEvent(withCompanies(), "event-01")).toEqual([
      { companyId: "company-03", name: "Beta Oy" },
    ]);
  });

  it("sendReminder_duplicate_alreadySent", () => {
    const input = { eventId: "event-01", companyId: "company-02", kind: "set-requirements" as const };
    const first = sendReminder(withCompanies(), input, NOW);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.value.reminders).toHaveLength(1);
    expect(sendReminder(first.value, input, NOW)).toEqual({ ok: false, error: "already-sent" });
  });

  it("openReminders_resolvedOnceCoreSet", () => {
    const sent = sendReminder(withCompanies(), { eventId: "event-01", companyId: "company-02", kind: "set-requirements" }, NOW);
    if (!sent.ok) throw new Error("setup");
    expect(openReminders(sent.value, "company-02")).toHaveLength(1);
    const withCore: Db = {
      ...sent.value,
      requirements: [
        ...sent.value.requirements,
        { id: "r", companyId: "company-02", text: "t", inPractice: "p", rank: 1, isCore: true },
      ],
    };
    expect(openReminders(withCore, "company-02")).toEqual([]);
  });

  it("openReminders_resolvedOnceJoined", () => {
    const sent = sendReminder(withCompanies(), { eventId: "event-01", companyId: "company-03", kind: "join-event" }, NOW);
    if (!sent.ok) throw new Error("setup");
    expect(openReminders(sent.value, "company-03")).toHaveLength(1);
    const joined = joinEvent(sent.value, "company-03", "event-01");
    if (!joined.ok) throw new Error("join");
    expect(openReminders(joined.value, "company-03")).toEqual([]);
  });

  it("joinEvent_withoutInvite_notInvited", () => {
    expect(joinEvent(withCompanies(), "company-03", "event-01")).toEqual({ ok: false, error: "not-invited" });
  });

  it("joinEvent_duplicate_alreadyAttending", () => {
    expect(joinEvent(makeDb(), "company-01", "event-01")).toEqual({ ok: false, error: "already-attending" });
  });
});
