import { historyTasks } from '../db/schema';
import { BaseRepository } from './base.repository';
import { eq, and, gte, lte } from 'drizzle-orm';

class HistoryTasksRepository extends BaseRepository<typeof historyTasks> {
  constructor() {
    super(historyTasks);
  }

  async findByDate(date: string) {
    try {
      return await this.db.select().from(this.table).where(eq(this.table.date, date)).all();
    } catch (error) {
      console.error(`[DB Error] Failed to find tasks for date ${date}:`, error);
      throw error;
    }
  }

  async findByDateRange(startDate: string, endDate: string) {
    try {
      return await this.db
        .select()
        .from(this.table)
        .where(and(gte(this.table.date, startDate), lte(this.table.date, endDate)))
        .all();
    } catch (error) {
      console.error(`[DB Error] Failed to find tasks in range ${startDate} to ${endDate}:`, error);
      throw error;
    }
  }

  async findByDateAndId(date: string, id: string) {
    try {
      return await this.db
        .select()
        .from(this.table)
        .where(and(eq(this.table.date, date), eq(this.table.id, id)))
        .get();
    } catch (error) {
      console.error(`[DB Error] Failed to find task ${id} for date ${date}:`, error);
      throw error;
    }
  }

  async deleteByDate(date: string) {
    try {
      return await this.db.delete(this.table).where(eq(this.table.date, date)).returning().all();
    } catch (error) {
      console.error(`[DB Error] Failed to delete tasks for date ${date}:`, error);
      throw error;
    }
  }
}

export const historyTasksRepository = new HistoryTasksRepository();
