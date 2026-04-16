import { worklogs } from '../db/schema';
import { BaseRepository } from './base.repository';
import { desc, and, gte, lte } from 'drizzle-orm';

export class WorklogRepository extends BaseRepository<typeof worklogs> {
  constructor() {
    super(worklogs);
  }

  /**
   * List recent worklogs
   */
  async getRecent(limit = 20) {
    return await this.db
      .select()
      .from(this.table)
      .orderBy(desc(this.table.createdAt))
      .limit(limit)
      .all();
  }

  /**
   * Find worklogs within a date range
   */
  async getByRange(start: Date, end: Date) {
    return await this.db
      .select()
      .from(this.table)
      .where(
        and(
          gte(this.table.startedAt, start),
          lte(this.table.startedAt, end)
        )
      )
      .orderBy(desc(this.table.startedAt))
      .all();
  }

  /**
   * Mark a worklog as synced to Jira
   */
  async markAsSynced(id: string, jiraWorklogId: string) {
    return await this.update(id, {
      syncedToJira: true,
      jiraWorklogId,
    });
  }
}

// Singleton instance
export const worklogRepository = new WorklogRepository();
