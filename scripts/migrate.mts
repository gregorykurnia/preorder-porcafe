// Applies the SQL migrations in ./drizzle to the Neon database in DATABASE_URL.
// Usage: npm run db:migrate (reads .env.local). Local PGlite migrates itself.
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const db = drizzle({ client: neon(url) });
await migrate(db, { migrationsFolder: "drizzle" });
console.log("Migrations applied.");
