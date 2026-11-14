import { describe, expect, test } from "vitest";
import { makeDb } from "./fixtures";
import { signalsLeft, spendSignal } from "./signals";
import type { Db } from "./types";

const withCompanies = (n: number): Db => {
  const db = makeDb({ signals: [] });
  const extra = Array.from({ length: n }, (_, i) => ({ id: `company-x${i}`, name: `X${i}`, sector: "s", sizeRange: "1" }));
  const reqs = extra.map((c) => ({ id: `req-${c.id}`, companyId: c.id, text: "t", inPractice: "p", rank: 1, isCore: true }));
  const links = extra.map((c) => ({ id: `l-${c.id}`, storyId: "story-017-a", requirementId: `req-${c.id}`, origin: "applicant" as const, status: "accepted" as const }));
  return { ...db, companies: [...db.companies, ...extra], requirements: [...db.requirements, ...reqs], links: [...db.links, ...links] };
};

describe("signals", () => {
  test("signalsLeft_noSignalsSpent_returnsEventAllowance", () => {
    expect(signalsLeft(makeDb({ signals: [] }), "event-01", "talent-017")).toBe(3);
  });
  test("spendSignal_withAcceptedExample_addsSignalWithoutMutating", () => {
    const db = makeDb({ signals: [] });
    const r = spendSignal(db, "event-01", "talent-017", "company-01");
    expect(r.ok && r.value.signals).toEqual([{ eventId: "event-01", applicantId: "talent-017", companyId: "company-01" }]);
    expect(db.signals).toEqual([]);
    expect(r.ok && signalsLeft(r.value, "event-01", "talent-017")).toBe(2);
  });
  test("spendSignal_fourthWithThreePerEvent_refusesNoSignalsLeft", () => {
    let db = withCompanies(4);
    for (const c of ["company-x0", "company-x1", "company-x2"]) {
      const r = spendSignal(db, "event-01", "talent-017", c);
      if (!r.ok) throw new Error(r.error);
      db = r.value;
    }
    expect(spendSignal(db, "event-01", "talent-017", "company-x3")).toEqual({ ok: false, error: "no-signals-left" });
  });
  test("spendSignal_sameCompanyTwice_refusesAlreadySignalled", () => {
    const first = spendSignal(makeDb({ signals: [] }), "event-01", "talent-017", "company-01");
    if (!first.ok) throw new Error(first.error);
    expect(spendSignal(first.value, "event-01", "talent-017", "company-01")).toEqual({ ok: false, error: "already-signalled" });
  });
  test("spendSignal_noAcceptedLinks_refusesNoAcceptedExample", () => {
    const noLinks = makeDb({ signals: [], links: [] });
    expect(spendSignal(noLinks, "event-01", "talent-017", "company-01")).toEqual({ ok: false, error: "no-accepted-example" });
  });
  test("spendSignal_onlyAcceptedLinkIsNonCore_refusesNoAcceptedExample", () => {
    const db = makeDb({
      signals: [],
      links: [{ id: "l", storyId: "story-017-a", requirementId: "req-01-5", origin: "applicant", status: "accepted" }],
    });
    expect(spendSignal(db, "event-01", "talent-017", "company-01")).toEqual({ ok: false, error: "no-accepted-example" });
  });
  test("spendSignal_unknownEvent_refusesNotFound", () => {
    expect(spendSignal(makeDb({ signals: [] }), "event-99", "talent-017", "company-01")).toEqual({ ok: false, error: "not-found" });
  });
});
