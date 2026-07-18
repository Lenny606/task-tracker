import { drizzle as drizzleBetterSqlite } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
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

const getDbClient = () => {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    console.log(`[DB] Connecting to Turso database: ${tursoUrl}`);
    const client = createClient({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return drizzleLibsql(client, { schema }) as any;
  }

  // Fallback for development/local
  const dbPath = getDatabasePath();
  console.log(`[DB] Fallback: Using local SQLite database at: ${dbPath}`);
  const sqlite = new Database(dbPath);

  // Enable WAL mode for better performance
  sqlite.pragma('journal_mode = WAL');

  return drizzleBetterSqlite(sqlite, { schema }) as any;
};

export const db = getDbClient();

export type DbClient = typeof db;
