import { describe, it, expect, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema';

const sqlite = new Database(':memory:');
const testDb = drizzle(sqlite, { schema });

vi.mock('../db', () => ({ db: testDb }));

const { trackerProjectRepository } = await import('./trackerProject.repository');

beforeEach(() => {
  sqlite.exec(`
    DROP TABLE IF EXISTS tracker_projects;
    CREATE TABLE tracker_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      time_budget_seconds INTEGER NOT NULL DEFAULT 0,
      color TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER
    );
  `);
});

describe('trackerProjectRepository soft delete', () => {
  it('soft deletes instead of removing the row', async () => {
    await trackerProjectRepository.create({
      id: 'p1',
      name: 'Project 1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await trackerProjectRepository.delete('p1');

    const raw = sqlite.prepare('SELECT * FROM tracker_projects WHERE id = ?').get('p1') as any;
    expect(raw).toBeDefined();
    expect(raw.deleted_at).not.toBeNull();
  });

  it('excludes soft-deleted projects from findAll', async () => {
    await trackerProjectRepository.create({
      id: 'p1',
      name: 'Project 1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await trackerProjectRepository.create({
      id: 'p2',
      name: 'Project 2',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await trackerProjectRepository.delete('p1');

    const all = await trackerProjectRepository.findAll();
    expect(all.map((p: any) => p.id)).toEqual(['p2']);
  });
});
