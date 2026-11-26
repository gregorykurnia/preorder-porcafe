import "server-only";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Db = NeonHttpDatabase<typeof schema>;

let dbPromise: Promise<Db> | undefined;

/**
 * Neon (over HTTP) when DATABASE_URL is set, as on Vercel.
 * Otherwise a local PGlite database in PGLITE_DIR (default .data/pglite),
 * migrated on first use, for development and tests. Tests never reach Neon.
 */
export function getDb(): Promise<Db> {
  dbPromise ??= open();
  return dbPromise;
}

async function open(): Promise<Db> {
  const url = process.env.DATABASE_URL;
  // PGLITE_DIR means "use a local database" and wins, so a test run can never reach Neon.
  if (url && !process.env.PGLITE_DIR) {
    const { neon } = await import("@neondatabase/serverless");
    const { drizzle } = await import("drizzle-orm/neon-http");
    return drizzle({ client: neon(url), schema });
  }
  if (process.env.VERCEL) throw new Error("DATABASE_URL is not set");
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = process.env.PGLITE_DIR ?? ".data/pglite";
  const { mkdirSync } = await import("node:fs");
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  const db = drizzle({ client, schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  return db as unknown as Db;
}
