import { describe, expect, test } from "vitest";
import { buildCard } from "./cards";
import { INTERNATIONAL_SUPPORT } from "../content/internationalSupport";
import { makeDb } from "./fixtures";
import { companySeesMovingHelp, setMovingHelp } from "./movingHelp";
import { exportApplicantData } from "./privacy";
import type { Db } from "./types";

const ME = "talent-017";
const MEETING = "m-me";

function dbWith(decisions: Db["decisions"], optedIn: boolean): Db {
  const base = makeDb();
  return {
    ...base,
    applicants: base.applicants.map((a) => (a.id === ME ? { ...a, wantsMovingHelp: optedIn } : a)),
    meetings: [{ id: MEETING, eventId: "event-01", companyId: "company-01", applicantId: ME, status: "booked", slotStart: "14:00" }],
    decisions,
  };
}

const BOTH_CONTINUE: Db["decisions"] = [
  { meetingId: MEETING, side: "applicant", continue: true },
  { meetingId: MEETING, side: "company", continue: true },
];

describe("movingHelp", () => {
  test("companySeesMovingHelp_beforeMatch_false", () => {
    const waiting = dbWith([{ meetingId: MEETING, side: "applicant", continue: true }], true);
    expect(companySeesMovingHelp(waiting, MEETING)).toBe(false);
  });

  test("companySeesMovingHelp_afterMatchOptedIn_true", () => {
    expect(companySeesMovingHelp(dbWith(BOTH_CONTINUE, true), MEETING)).toBe(true);
  });

  test("companySeesMovingHelp_matchNotOptedIn_false", () => {
    expect(companySeesMovingHelp(dbWith(BOTH_CONTINUE, false), MEETING)).toBe(false);
  });

  test("companySeesMovingHelp_noMatch_false", () => {
    const declined: Db["decisions"] = [
      { meetingId: MEETING, side: "applicant", continue: true },
      { meetingId: MEETING, side: "company", continue: false, feedback: { "req-01-1": "x" } },
    ];
    expect(companySeesMovingHelp(dbWith(declined, true), MEETING)).toBe(false);
  });

  test("buildCard_neverContainsMovingHelp", () => {
    const card = buildCard(dbWith(BOTH_CONTINUE, true), "company-01", ME);
    expect(JSON.stringify(card)).not.toContain("wantsMovingHelp");
  });

  test("setMovingHelp_unknownApplicant_notFound", () => {
    expect(setMovingHelp(makeDb(), "nobody", true)).toEqual({ ok: false, error: "not-found" });
  });

  test("setMovingHelp_toggle_setsOnlyThatApplicant", () => {
    const result = setMovingHelp(makeDb(), ME, true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.value.applicants.find((a) => a.id === ME)?.wantsMovingHelp).toBe(true);
    expect(result.value.applicants.filter((a) => a.wantsMovingHelp)).toHaveLength(1);
  });

  test("exportApplicantData_includesMovingHelpChoice", () => {
    expect(exportApplicantData(dbWith(BOTH_CONTINUE, true), ME)?.applicant.wantsMovingHelp).toBe(true);
  });

  test("internationalSupport_everyLink_isHttpsWithAudience", () => {
    expect(INTERNATIONAL_SUPPORT.length).toBeGreaterThanOrEqual(4);
    for (const s of INTERNATIONAL_SUPPORT) {
      expect(s.url.startsWith("https://")).toBe(true);
      expect(["applicant", "company", "both"]).toContain(s.audience);
    }
  });
});
