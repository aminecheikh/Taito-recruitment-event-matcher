import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DbSchema, emptyDb, type Db } from "@/lib/domain/types";

export const DEFAULT_SEED_DIR = "data/synthetic";

const SEED_FILES = [
  "companies/companies.json",
  "talent/talent.json",
  "events/events.json",
] as const;

function readSeedFile(path: string): Partial<Db> {
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(/*turbopackIgnore: true*/ path, "utf8")) as Partial<Db>;
}

/** Merges whichever seed files exist; missing files contribute nothing. */
export function loadSeed(dir: string = DEFAULT_SEED_DIR): Db {
  const merged = SEED_FILES.reduce<Db>(
    (acc, file) => ({ ...acc, ...readSeedFile(join(/*turbopackIgnore: true*/ dir, file)) }),
    emptyDb(),
  );
  return DbSchema.parse(merged);
}
