import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { answersFromAcceptedLinks } from "@/lib/domain/migrate";
import { DbSchema, type Db, type Result } from "@/lib/domain/types";
import { loadSeed } from "./seed";

const DEFAULT_DB_PATH = "data/runtime/db.json";

// Env is read at call time so tests can point each test at its own files.
// `||` not `??`: a copied .env loads `DB_PATH=` as "", which must fall back to the default.
export const dbPath = () => process.env.DB_PATH || DEFAULT_DB_PATH;
const seed = () => loadSeed(process.env.SEED_DIR || undefined);

let queue: Promise<unknown> = Promise.resolve();

/** Runs tasks one at a time; a failing task does not break the chain. */
function serialise<T>(task: () => T): Promise<T> {
  const run = queue.then(task);
  queue = run.catch(() => undefined);
  return run;
}

function writeAtomic(db: Db): void {
  const path = dbPath();
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(db, null, 2));
  renameSync(tmp, path);
}

function reseed(reason: string): Db {
  console.warn(`[store] ${reason}; reseeding ${dbPath()}`);
  const fresh = seed();
  writeAtomic(fresh);
  return fresh;
}

/** Files written before requirement cards have no `entries` key. */
function isLegacy(json: unknown): boolean {
  return typeof json === "object" && json !== null && !("entries" in json);
}

function migrate(db: Db): Db {
  const migrated = answersFromAcceptedLinks(db);
  writeAtomic(migrated);
  return migrated;
}

function readSync(): Db {
  let raw: string;
  try {
    raw = readFileSync(/*turbopackIgnore: true*/ dbPath(), "utf8");
  } catch {
    return reseed("db file missing");
  }
  try {
    const json: unknown = JSON.parse(raw);
    const parsed = DbSchema.safeParse(json);
    if (!parsed.success) return reseed("db file failed validation");
    return isLegacy(json) ? migrate(parsed.data) : parsed.data;
  } catch {
    return reseed("db file is not valid JSON");
  }
}

export function readDb(): Promise<Db> {
  return serialise(readSync);
}

export function updateDb(fn: (db: Db) => Result<Db>): Promise<Result<Db>> {
  return serialise(() => {
    const result = fn(readSync());
    if (result.ok) writeAtomic(result.value);
    return result;
  });
}

export function resetDb(): Promise<Db> {
  return serialise(() => {
    const fresh = seed();
    writeAtomic(fresh);
    return fresh;
  });
}
