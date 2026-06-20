import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const getDatabasePath = (): string => {
  const envPath = process.env.DATABASE_URL;
  if (envPath) return envPath;

  const dbDir = path.resolve(process.cwd(), '.db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, 'task-tracker.sqlite');
};

const run = () => {
  const dbPath = getDatabasePath();
  console.log(`[Migrate] Running migrations on: ${dbPath}`);

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');

  const db = drizzle(sqlite);

  // Drizzle migrator reads from ./drizzle folder relative to cwd
  const migrationsFolder = path.resolve(process.cwd(), 'drizzle');
  migrate(db, { migrationsFolder });

  sqlite.close();
  console.log('[Migrate] Migrations applied successfully.');
};

run();
