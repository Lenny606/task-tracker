import { trackerProjects, historyTasks, worklogs } from '../db/schema';
import { BaseRepository } from './base.repository';
import { eq, sql } from 'drizzle-orm';

class TrackerProjectRepository extends BaseRepository<typeof trackerProjects> {
  constructor() {
    super(trackerProjects);
  }

  async findAllWithStats() {
    // We calculate total spent time from both historyTasks and worklogs
    // This is a bit complex for a single query in SQLite with Drizzle return types, 
    // so we'll fetch projects and then aggregate stats.
    const projects = await this.findAll();

    const stats = await Promise.all(projects.map(async (project) => {
      const dbTasks = await this.db
        .select({
          name: historyTasks.name,
          date: historyTasks.date,
          seconds: historyTasks.totalSeconds,
        })
        .from(historyTasks)
        .where(eq(historyTasks.trackerProjectId, project.id))
        .all();

      const dbWorklogs = await this.db
        .select({
          name: worklogs.summary,
          date: sql<string>`strftime('%Y-%m-%d', datetime(${worklogs.startedAt}/1000, 'unixepoch'))`,
          seconds: worklogs.timeSpentSeconds,
        })
        .from(worklogs)
        .where(eq(worklogs.trackerProjectId, project.id))
        .all();

      // Combine and aggregate by name + date
      const taskMap = new Map<string, { name: string, date: string, seconds: number }>();

      [...dbTasks, ...dbWorklogs].forEach(t => {
        const key = `${t.date}-${t.name}`;
        const existing = taskMap.get(key);
        if (existing) {
          existing.seconds += t.seconds;
        } else {
          taskMap.set(key, { name: t.name, date: t.date, seconds: t.seconds });
        }
      });

      const relatedTasks = Array.from(taskMap.values())
        .sort((a, b) => b.date.localeCompare(a.date));

      const totalSpent = relatedTasks.reduce((sum, t) => sum + t.seconds, 0);

      return {
        ...project,
        totalSpentSeconds: totalSpent,
        isOverBudget: project.timeBudgetSeconds > 0 && totalSpent > project.timeBudgetSeconds,
        relatedTasks,
      };
    }));

    return stats;
  }
}

export const trackerProjectRepository = new TrackerProjectRepository();
