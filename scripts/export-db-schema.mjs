// Dumps the live DDL from the Turso database to exports/db-schema.sql.
// Run: npm run db:schema:export  (requires TURSO_DATABASE_URL + TURSO_AUTH_TOKEN in .env)
import { createClient } from '@libsql/client';
import { writeFileSync, mkdirSync } from 'node:fs';

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error('TURSO_DATABASE_URL is not set — run via `npm run db:schema:export` so .env is loaded.');
  process.exit(1);
}

const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

const { rows } = await db.execute(
  `SELECT type, name, sql FROM sqlite_master
   WHERE sql IS NOT NULL
     AND name NOT LIKE 'sqlite_%'
     AND name NOT LIKE 'libsql_%'
     AND name != '__drizzle_migrations'
   ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END, name`
);

const header = `-- Task Tracker live schema (Turso)\n-- Generated ${new Date().toISOString()} by scripts/export-db-schema.mjs\n\n`;
const body = rows.map((r) => r.sql + ';').join('\n\n') + '\n';

mkdirSync('exports', { recursive: true });
writeFileSync('exports/db-schema.sql', header + body);
console.log(`Wrote exports/db-schema.sql (${rows.length} objects)`);
db.close();
