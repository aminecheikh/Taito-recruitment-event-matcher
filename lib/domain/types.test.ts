import { expect, test } from "vitest";
import { DbSchema, ScoreSchema, emptyDb } from "./types";

test("Score rejects values outside 0–10 and non-integers", () => {
  const base = { companyId: "company-01", applicantId: "talent-017", requirementId: "req-01-1", stage: "card" };
  expect(ScoreSchema.safeParse({ ...base, value: 11 }).success).toBe(false);
  expect(ScoreSchema.safeParse({ ...base, value: 7.5 }).success).toBe(false);
  expect(ScoreSchema.safeParse({ ...base, value: 7 }).success).toBe(true);
});

test("DbSchema accepts an empty db", () => {
  expect(DbSchema.safeParse(emptyDb()).success).toBe(true);
});

test("DbSchema parses a db without entries and answers, defaulting both to empty", () => {
  const legacy: Record<string, unknown> = { ...emptyDb() };
  delete legacy.entries;
  delete legacy.answers;
  const parsed = DbSchema.safeParse(legacy);
  expect(parsed.success).toBe(true);
  expect(parsed.success && parsed.data.entries).toEqual([]);
  expect(parsed.success && parsed.data.answers).toEqual([]);
});
