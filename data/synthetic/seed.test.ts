import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSeed } from "./generate.mjs";
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

  it("test_events_when_seeded_have_valid_window_location_and_fictional_name", () => {
    expect(db.events.length).toBeGreaterThanOrEqual(3);
    for (const e of db.events) {
      expect(e.signalsPerApplicant, e.id).toBe(3);
      expect(e.location.endsWith("(fictional)"), e.id).toBe(true);
      expect(e.name.endsWith("(fictional)"), e.id).toBe(true);
      expect(e.endTime > e.startTime, e.id).toBe(true);
    }
  });

  it("test_demo_pair_when_seeded_attends_event_01", () => {
    expect(db.applicantEvents).toContainEqual({ applicantId: "talent-017", eventId: "event-01" });
    expect(db.companyEvents).toContainEqual({ companyId: "company-01", eventId: "event-01" });
  });

  it("test_meetings_when_seeded_are_empty", () => {
    expect(db.meetings).toEqual([]);
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

  it("test_references_when_seeded_all_resolve", () => {
    const ids = (xs: { id: string }[]) => new Set(xs.map((x) => x.id));
    const companies = ids(db.companies), reqs = ids(db.requirements), stories = ids(db.stories);
    const applicants = ids(db.applicants), events = ids(db.events);
    for (const r of db.requirements) expect(companies.has(r.companyId), r.id).toBe(true);
    for (const s of db.stories) expect(applicants.has(s.applicantId), s.id).toBe(true);
    for (const l of db.links) {
      expect(stories.has(l.storyId), l.id).toBe(true);
      expect(reqs.has(l.requirementId), l.id).toBe(true);
    }
    for (const s of db.signals) {
      expect(events.has(s.eventId)).toBe(true);
      expect(applicants.has(s.applicantId)).toBe(true);
      expect(companies.has(s.companyId)).toBe(true);
    }
    for (const ce of db.companyEvents) {
      expect(companies.has(ce.companyId)).toBe(true);
      expect(events.has(ce.eventId)).toBe(true);
    }
    for (const ae of db.applicantEvents) {
      expect(applicants.has(ae.applicantId)).toBe(true);
      expect(events.has(ae.eventId)).toBe(true);
    }
  });

  it("test_acme_accepted_links_when_seeded_point_at_core_requirements", () => {
    const core = new Set(db.requirements.filter((r) => r.companyId === "company-01" && r.isCore).map((r) => r.id));
    const acme = db.links.filter((l) => l.requirementId.startsWith("req-01-") && l.status === "accepted");
    expect(acme.length).toBeGreaterThan(0);
    for (const l of acme) expect(core.has(l.requirementId), l.id).toBe(true);
  });

  it("test_entries_and_answers_when_seeded_resolve_and_cover_accepted_links", () => {
    const applicants = new Set(db.applicants.map((a) => a.id));
    const entries = new Map(db.entries.map((e) => [e.id, e]));
    const core = new Set(db.requirements.filter((r) => r.isCore).map((r) => r.id));
    expect(db.entries.length).toBeGreaterThan(0);
    for (const e of db.entries) expect(applicants.has(e.applicantId), e.id).toBe(true);
    const seen = new Set<string>();
    for (const a of db.answers) {
      const e = entries.get(a.entryId);
      expect(e, a.entryId).toBeDefined();
      expect(e?.applicantId).toBe(a.applicantId);
      expect(core.has(a.requirementId), a.requirementId).toBe(true);
      const key = `${a.applicantId}|${a.requirementId}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
  });

  it("test_generator_when_called_twice_is_deterministic", () => {
    expect(buildSeed()).toEqual(buildSeed());
  });

  it("test_generator_output_matches_committed_json_files", () => {
    for (const [rel, data] of Object.entries(buildSeed())) {
      expect(read(rel), rel).toEqual(data);
    }
  });
});
