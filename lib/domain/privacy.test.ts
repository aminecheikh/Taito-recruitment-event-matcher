import { describe, expect, test } from "vitest";
import { makeDb } from "./fixtures";
import { deleteApplicantData, deleteStory, exportApplicantData, PERSONAL_DATA_FIELDS, RETENTION_DAYS } from "./privacy";
import { ApplicantSchema, type Db } from "./types";

const ME = "talent-017";
const OTHER = "talent-020";

function richDb(): Db {
  const base = makeDb();
  return {
    ...base,
    meetings: [
      { id: "m-me", eventId: "event-01", companyId: "company-01", applicantId: ME, status: "booked", slotStart: "14:00" },
      { id: "m-other", eventId: "event-01", companyId: "company-01", applicantId: OTHER, status: "booked", slotStart: "14:30" },
    ],
    decisions: [
      { meetingId: "m-me", side: "applicant", continue: true },
      { meetingId: "m-me", side: "company", continue: false, feedback: { "req-01-1": "Needs more depth" } },
      { meetingId: "m-other", side: "applicant", continue: true },
      { meetingId: "m-other", side: "company", continue: false, feedback: { "req-01-1": "Secret other feedback" } },
    ],
    shares: [
      { meetingId: "m-me", applicant: { contact: "talent-017@example.org" } },
      { meetingId: "m-other", applicant: { contact: "talent-020@example.org" } },
    ],
    scores: [
      { companyId: "company-01", applicantId: ME, requirementId: "req-01-1", stage: "card", value: 7 },
      { companyId: "company-01", applicantId: OTHER, requirementId: "req-01-1", stage: "card", value: 5 },
    ],
  };
}

describe("privacy", () => {
  test("privacy_everyPersonalField_hasAPurpose", () => {
    const required = [
      ...Object.keys(ApplicantSchema.shape).filter((k) => k !== "id").map((k) => `applicants.${k}`),
      "stories.body",
      "entries.body",
      "shares.applicant",
      "scores.value",
      "decisions.feedback",
    ];
    for (const key of required) {
      const row = PERSONAL_DATA_FIELDS.find((f) => `${f.collection}.${f.field}` === key);
      expect(row, key).toBeDefined();
      expect(row?.purpose.length).toBeGreaterThan(5);
      expect(row?.whoSees.length).toBeGreaterThan(2);
      expect(row?.deletedWhen.length).toBeGreaterThan(2);
    }
    expect(RETENTION_DAYS).toBe(30);
  });

  test("exportApplicantData_ownDataOnly", () => {
    const out = exportApplicantData(richDb(), ME);
    expect(out?.applicant.id).toBe(ME);
    expect(out?.stories.every((s) => s.applicantId === ME)).toBe(true);
    expect(out?.stories).toHaveLength(2);
    expect(out?.entries).toHaveLength(1);
    expect(out?.answers).toHaveLength(1);
    expect(out?.signals).toHaveLength(1);
    expect(out?.meetings.map((m) => m.id)).toEqual(["m-me"]);
    expect(out?.meetings[0].companyName).toBe("Demo Company");
    expect(out?.shares.map((s) => s.meetingId)).toEqual(["m-me"]);
    expect(JSON.stringify(out)).not.toContain("Secret other feedback");
    expect(JSON.stringify(out)).not.toContain(OTHER);
  });

  test("exportApplicantData_neverIncludesScores", () => {
    const out = exportApplicantData(richDb(), ME);
    expect(out).not.toHaveProperty("scores");
    expect(JSON.stringify(out)).not.toContain('"value":7');
  });

  test("exportApplicantData_feedbackOnlyAfterReveal", () => {
    const db = richDb();
    const revealed = exportApplicantData(db, ME);
    expect(revealed?.feedback).toEqual([{ meetingId: "m-me", feedback: { "req-01-1": "Needs more depth" } }]);
    const withoutMine = { ...db, decisions: db.decisions.filter((d) => !(d.meetingId === "m-me" && d.side === "applicant")) };
    const hidden = exportApplicantData(withoutMine, ME);
    expect(hidden?.feedback).toEqual([]);
    expect(JSON.stringify(hidden)).not.toContain("Needs more depth");
    expect(hidden?.decisions).toEqual([]);
  });

  test("exportApplicantData_unknown_returnsNull", () => {
    expect(exportApplicantData(richDb(), "nobody")).toBeNull();
  });

  test("deleteApplicantData_removesEveryTrace", () => {
    const db = richDb();
    const r = deleteApplicantData(db, ME);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const text = JSON.stringify(r.value);
    expect(text).not.toContain(`"${ME}"`);
    expect(text).not.toContain("m-me");
    expect(text).not.toContain("link-017");
    expect(r.value.stories.filter((s) => s.applicantId === OTHER)).toHaveLength(2);
    expect(r.value.entries.filter((e) => e.applicantId === OTHER)).toHaveLength(2);
    expect(r.value.meetings.map((m) => m.id)).toEqual(["m-other"]);
    expect(r.value.decisions).toHaveLength(2);
    expect(r.value.shares).toHaveLength(1);
    expect(r.value.scores).toHaveLength(1);
    expect(r.value.links.filter((l) => l.id.startsWith("link-020"))).toHaveLength(3);
    expect(r.value.companies).toEqual(db.companies);
  });

  test("deleteApplicantData_unknown_returnsNotFound", () => {
    expect(deleteApplicantData(richDb(), "nobody")).toEqual({ ok: false, error: "not-found" });
  });

  test("deleteStory_own_removesStoryLinksAndEntrySource", () => {
    const r = deleteStory(makeDb(), ME, "story-017-a");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.stories.some((s) => s.id === "story-017-a")).toBe(false);
    expect(r.value.links.some((l) => l.storyId === "story-017-a")).toBe(false);
    const entry = r.value.entries.find((e) => e.id === "entry-story-017-a");
    expect(entry).toBeDefined();
    expect(entry).not.toHaveProperty("sourceStoryId");
    expect(r.value.links.some((l) => l.storyId === "story-017-b")).toBe(true);
  });

  test("deleteStory_otherApplicants_notFound", () => {
    expect(deleteStory(makeDb(), OTHER, "story-017-a")).toEqual({ ok: false, error: "not-found" });
    expect(deleteStory(makeDb(), ME, "nope")).toEqual({ ok: false, error: "not-found" });
  });
});
