import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { fileURLToPath } from "node:url";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");

const client = postgres(url, { max: 1, onnotice: () => {} });
await migrate(drizzle(client), {
  migrationsFolder: process.env.MIGRATIONS_DIR ?? fileURLToPath(new URL("../migrations", import.meta.url)),
});
await client.end();
console.log("Migrations applied");
