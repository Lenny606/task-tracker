import Database from 'better-sqlite3';
import path from 'node:path';

const dbPath = path.resolve(process.cwd(), '.db/task-tracker.sqlite');
const db = new Database(dbPath);

try {
  console.log('Adding tracker_projects table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS tracker_projects (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      time_budget_seconds INTEGER DEFAULT 0 NOT NULL,
      color TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  
  console.log('Adding tracker_project_id column to history_tasks...');
  try {
    db.exec('ALTER TABLE history_tasks ADD COLUMN tracker_project_id TEXT;');
  } catch (e) {
    console.log('history_tasks column might already exist:', e.message);
  }

  console.log('Adding tracker_project_id column to worklogs...');
  try {
    db.exec('ALTER TABLE worklogs ADD COLUMN tracker_project_id TEXT;');
  } catch (e) {
    console.log('worklogs column might already exist:', e.message);
  }

  console.log('Done!');
} catch (e) {
  console.error('Error fixing DB:', e);
}
