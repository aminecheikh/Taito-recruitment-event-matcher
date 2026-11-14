import { describe, expect, test } from "vitest";
import { applicantsAt, companiesAt, coreIdsAtEvent } from "./attendance";
import { makeDb } from "./fixtures";
import { emptyDb, type Db } from "./types";

const db: Db = {
  ...emptyDb(),
  companyEvents: [
    { companyId: "company-01", eventId: "event-01" },
    { companyId: "company-02", eventId: "event-02" },
    { companyId: "company-03", eventId: "event-01" },
  ],
  applicantEvents: [
    { applicantId: "talent-017", eventId: "event-01" },
    { applicantId: "talent-003", eventId: "event-02" },
  ],
};

describe("attendance", () => {
  test("test_companiesAt_event_returnsAttendingCompaniesInSeedOrder", () => {
    expect(companiesAt(db, "event-01")).toEqual(["company-01", "company-03"]);
  });

  test("test_applicantsAt_event_returnsRegisteredApplicants", () => {
    expect(applicantsAt(db, "event-02")).toEqual(["talent-003"]);
  });

  test("test_companiesAt_unknownEvent_returnsEmpty", () => {
    expect(companiesAt(db, "event-99")).toEqual([]);
    expect(applicantsAt(db, "event-99")).toEqual([]);
  });
});

describe("coreIdsAtEvent", () => {
  test("test_coreIdsAtEvent_attendingCompany_returnsOnlyCoreRequirementIds", () => {
    expect(coreIdsAtEvent(makeDb(), "event-01")).toEqual(new Set(["req-01-1", "req-01-2", "req-01-3", "req-01-4"]));
  });

  test("test_coreIdsAtEvent_eventWithoutCompanies_returnsEmpty", () => {
    expect(coreIdsAtEvent(makeDb(), "event-99").size).toBe(0);
  });
});
