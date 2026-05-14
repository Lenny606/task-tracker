import Database from 'better-sqlite3';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), '.db/task-tracker.sqlite');
const db = new Database(dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));

for (const table of tables) {
  const count = db.prepare(`SELECT count(*) as count FROM ${table.name}`).get();
  console.log(`${table.name}: ${count.count} rows`);
}
