import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";
export { schema };

export type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __electricademyDb?: Database };

/**
 * Lazily creates a single shared connection. Lazy so that `next build`
 * does not require a database unless a page actually queries it.
 */
export function getDb(): Database {
  if (globalForDb.__electricademyDb) return globalForDb.__electricademyDb;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, { max: 10 });
  const db = drizzle(client, { schema });
  globalForDb.__electricademyDb = db;
  return db;
}
