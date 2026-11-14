import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, test } from "vitest";
import { dbPath, readDb, resetDb, updateDb } from "./db";
import { loadSeed } from "./seed";
import { emptyDb } from "@/lib/domain/types";

const FIXTURE_SEED = join(__dirname, "__fixtures__", "seed");
const seedFixture = loadSeed(FIXTURE_SEED);

const sigA = { eventId: "event-01", applicantId: "talent-017", companyId: "company-01" };
const sigB = { eventId: "event-01", applicantId: "talent-017", companyId: "company-02" };

beforeEach(() => {
  const dir = mkdtempSync(join(tmpdir(), "store-test-"));
  process.env.DB_PATH = join(dir, "db.json");
  process.env.SEED_DIR = FIXTURE_SEED;
});

describe("loadSeed", () => {
  test("loadSeed_fixtureDir_mergesAllThreeFiles", () => {
    expect(seedFixture.companies).toHaveLength(2);
    expect(seedFixture.applicants).toHaveLength(1);
    expect(seedFixture.events).toHaveLength(1);
    expect(seedFixture.meetings).toEqual([]);
  });

  test("loadSeed_missingDir_returnsEmptyDb", () => {
    expect(loadSeed(join(tmpdir(), "does-not-exist-xyz"))).toEqual(emptyDb());
  });
});

describe("dbPath", () => {
  test("dbPath_emptyEnvValue_fallsBackToDefault", () => {
    process.env.DB_PATH = "";
    expect(dbPath()).toBe("data/runtime/db.json");
  });
});

describe("store", () => {
  test("readDb_noFile_seedsAndPersists", async () => {
    const db = await readDb();
    expect(db.companies).toHaveLength(2);
    expect(JSON.parse(readFileSync(process.env.DB_PATH!, "utf8")).companies).toHaveLength(2);
  });

  test("updateDb_twoConcurrentUpdates_bothPersist", async () => {
    await Promise.all([
      updateDb((db) => ({ ok: true, value: { ...db, signals: [...db.signals, sigA] } })),
      updateDb((db) => ({ ok: true, value: { ...db, signals: [...db.signals, sigB] } })),
    ]);
    expect((await readDb()).signals).toHaveLength(2);
  });

  test("updateDb_failedUpdate_doesNotWrite", async () => {
    const before = await readDb();
    const r = await updateDb(() => ({ ok: false, error: "nope" }));
    expect(r).toEqual({ ok: false, error: "nope" });
    expect(await readDb()).toEqual(before);
  });

  test("readDb_corruptFile_reseeds", async () => {
    writeFileSync(process.env.DB_PATH!, "{not json");
    expect((await readDb()).companies.length).toBe(seedFixture.companies.length);
  });

  test("readDb_schemaInvalidFile_reseeds", async () => {
    writeFileSync(process.env.DB_PATH!, JSON.stringify({ companies: "x" }));
    expect((await readDb()).companies.length).toBe(seedFixture.companies.length);
  });

  test("resetDb_afterChanges_restoresSeed", async () => {
    await updateDb((db) => ({ ok: true, value: { ...db, signals: [sigA] } }));
    const db = await resetDb();
    expect(db.signals).toEqual([]);
    expect((await readDb()).signals).toEqual([]);
  });

  test("updateDb_afterRejectedUpdater_chainContinues", async () => {
    const bad = updateDb(() => {
      throw new Error("boom");
    });
    await expect(bad).rejects.toThrow("boom");
    const r = await updateDb((db) => ({ ok: true, value: db }));
    expect(r.ok).toBe(true);
  });
});
