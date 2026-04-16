import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'node:path';
import fs from 'node:fs';

// Determine the database path
// In development, we use a local .db folder
// In production, we'll get it from an environment variable passed from Electron
const getDatabasePath = () => {
  const envPath = process.env.DATABASE_URL;
  if (envPath) return envPath;

  // Fallback for development
  const dbDir = path.resolve(process.cwd(), '.db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, 'task-tracker.sqlite');
};

const dbPath = getDatabasePath();
console.log(`[DB] Using database at: ${dbPath}`);

const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

export type DbClient = typeof db;
