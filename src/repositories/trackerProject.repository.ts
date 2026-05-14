import { trackerProjects, historyTasks, worklogs } from '../db/schema';
import { BaseRepository } from './base.repository';
import { eq, sql } from 'drizzle-orm';

export class TrackerProjectRepository extends BaseRepository<typeof trackerProjects> {
  constructor() {
    super(trackerProjects);
  }

  async findAllWithStats() {
    // We calculate total spent time from both historyTasks and worklogs
    // This is a bit complex for a single query in SQLite with Drizzle return types, 
    // so we'll fetch projects and then aggregate stats.
    const projects = await this.findAll();
    
    const stats = await Promise.all(projects.map(async (project) => {
      const taskSeconds = await this.db
        .select({ total: sql<number>`sum(${historyTasks.totalSeconds})` })
        .from(historyTasks)
        .where(eq(historyTasks.trackerProjectId, project.id))
        .get();

      const worklogSeconds = await this.db
        .select({ total: sql<number>`sum(${worklogs.timeSpentSeconds})` })
        .from(worklogs)
        .where(eq(worklogs.trackerProjectId, project.id))
        .get();

      const totalSpent = (taskSeconds?.total || 0) + (worklogSeconds?.total || 0);
      
      return {
        ...project,
        totalSpentSeconds: totalSpent,
        isOverBudget: project.timeBudgetSeconds > 0 && totalSpent > project.timeBudgetSeconds,
      };
    }));

    return stats;
  }
}

export const trackerProjectRepository = new TrackerProjectRepository();
