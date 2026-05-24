import Database from 'better-sqlite3';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), '.db/task-tracker.sqlite');
console.log(`[Migration] Opening database at: ${dbPath}`);

const db = new Database(dbPath);

try {
  // Check existing columns
  const tableInfo = db.prepare("PRAGMA table_info(settings)").all();
  const columns = tableInfo.map(col => col.name);
  console.log('[Migration] Current settings columns:', columns);

  if (!columns.includes('ai_provider')) {
    console.log('[Migration] Adding ai_provider column...');
    db.prepare("ALTER TABLE settings ADD COLUMN ai_provider TEXT NOT NULL DEFAULT 'gemini'").run();
  } else {
    console.log('[Migration] Column ai_provider already exists.');
  }

  if (!columns.includes('gemini_api_key')) {
    console.log('[Migration] Adding gemini_api_key column...');
    db.prepare("ALTER TABLE settings ADD COLUMN gemini_api_key TEXT NOT NULL DEFAULT ''").run();
  } else {
    console.log('[Migration] Column gemini_api_key already exists.');
  }

  if (!columns.includes('openai_api_key')) {
    console.log('[Migration] Adding openai_api_key column...');
    db.prepare("ALTER TABLE settings ADD COLUMN openai_api_key TEXT NOT NULL DEFAULT ''").run();
  } else {
    console.log('[Migration] Column openai_api_key already exists.');
  }

  console.log('[Migration] Migration successfully completed!');
} catch (error) {
  console.error('[Migration] Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
