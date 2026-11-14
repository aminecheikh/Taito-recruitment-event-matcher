import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { DbSchema, emptyDb, MAX_CORE_REQUIREMENTS, type Db } from "@/lib/domain/types";

const dir = __dirname;
const read = (p: string) => JSON.parse(readFileSync(join(dir, p), "utf8"));

function loadSeed(): Db {
  return {
    ...emptyDb(),
    ...read("companies/companies.json"),
    ...read("talent/talent.json"),
    ...read("events/events.json"),
  };
}

describe("synthetic seed", () => {
  const db = loadSeed();

  it("test_seed_when_merged_into_db_parses_with_schema", () => {
    expect(() => DbSchema.parse(db)).not.toThrow();
  });

  it("test_companies_each_have_one_to_five_core_requirements", () => {
    for (const c of db.companies) {
      const core = db.requirements.filter((r) => r.companyId === c.id && r.isCore);
      expect(core.length).toBeGreaterThanOrEqual(1);
      expect(core.length).toBeLessThanOrEqual(MAX_CORE_REQUIREMENTS);
    }
  });

  it("test_contact_emails_always_use_example_org", () => {
    for (const a of db.applicants) expect(a.contact.email.endsWith("@example.org")).toBe(true);
  });

  it("test_company_names_always_end_with_fictional", () => {
    for (const c of db.companies) expect(c.name.endsWith("(fictional)")).toBe(true);
  });

  it("test_talent_017_when_seeded_has_story_but_no_links_or_signals", () => {
    const stories = db.stories.filter((s) => s.applicantId === "talent-017");
    expect(stories.length).toBeGreaterThan(0);
    const text = stories.map((s) => s.body).join(" ");
    for (const phrase of ["ticket reader", "traced a fault", "got the supplier to fix it"]) {
      expect(text).toContain(phrase);
    }
    const ids = new Set(stories.map((s) => s.id));
    expect(db.links.filter((l) => ids.has(l.storyId))).toEqual([]);
    expect(db.signals.filter((s) => s.applicantId === "talent-017")).toEqual([]);
  });

  it("test_acme_when_seeded_has_four_core_requirements_in_rank_order", () => {
    expect(db.companies.find((c) => c.id === "company-01")?.name).toBe("Acme Robotics Oy (fictional)");
    const core = db.requirements
      .filter((r) => r.companyId === "company-01" && r.isCore)
      .sort((a, b) => a.rank - b.rank);
    expect(core.map((r) => r.id)).toEqual(["req-01-1", "req-01-2", "req-01-3", "req-01-4"]);
    expect(core.map((r) => r.rank)).toEqual([1, 2, 3, 4]);
    expect(core.map((r) => r.text)).toEqual([
      "Debugging embedded systems",
      "Explaining technology to non-technical staff",
      "Working with suppliers",
      "Python",
    ]);
  });

  it("test_event_when_seeded_has_three_signals_and_ten_slots", () => {
    expect(db.events[0]?.signalsPerApplicant).toBe(3);
    for (const ce of db.companyEvents) expect(ce.meetingSlots).toBe(10);
  });

  it("test_acme_signals_when_seeded_cover_mixed_requirement_counts", () => {
    const signalled = db.signals.filter((s) => s.companyId === "company-01").map((s) => s.applicantId);
    expect(signalled.length).toBe(5);
    const coverage = signalled.map((id) => {
      const sids = new Set(db.stories.filter((s) => s.applicantId === id).map((s) => s.id));
      const reqs = db.links.filter((l) => sids.has(l.storyId) && l.status === "accepted" && l.requirementId.startsWith("req-01-"));
      return new Set(reqs.map((l) => l.requirementId)).size;
    }).sort();
    expect(coverage).toEqual([1, 2, 3, 3, 4]);
  });
});
