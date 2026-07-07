import { worklogs } from '../db/schema';
import { BaseRepository } from './base.repository';
import { desc, and, gte, lte, sql } from 'drizzle-orm';

class WorklogRepository extends BaseRepository<typeof worklogs> {
  constructor() {
    super(worklogs);
  }

  /**
   * Get frequently logged tickets based on worklog counts
   */
  async getFrequent(limit = 10) {
    return await this.db
      .select({
        key: this.table.jiraIssueKey,
        summary: this.table.summary,
      })
      .from(this.table)
      .groupBy(this.table.jiraIssueKey)
      .orderBy(desc(sql<number>`count(${this.table.jiraIssueKey})`))
      .limit(limit)
      .all();
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
