import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), '.db/task-tracker.sqlite');
const db = new Database(dbPath);

function checkTable(tableName) {
  try {
    const row = db.prepare(`SELECT count(*) as count FROM ${tableName}`).get();
    const count = row ? row.count : 0;
    console.log(`\n--- Table: ${tableName} ---`);
    console.log(`Total rows: ${count}`);
    
    if (count > 0) {
      const samples = db.prepare(`SELECT * FROM ${tableName} LIMIT 3`).all();
      console.log('Sample rows:');
      console.table(samples);
    }
  } catch (error) {
    console.error(`Error checking table ${tableName}: ${error.message}`);
  }
}

console.log('Verifying data in SQLite database at:', dbPath);

checkTable('settings');
checkTable('history_tasks');
checkTable('day_metrics');
checkTable('worklogs');

db.close();
