import { historyTasks } from '../db/schema';
import { BaseRepository } from './base.repository';
import { eq, and } from 'drizzle-orm';

export class HistoryTasksRepository extends BaseRepository<typeof historyTasks> {
  constructor() {
    super(historyTasks);
  }

  async findByDate(date: string) {
    return await this.db.select().from(this.table).where(eq(this.table.date, date)).all();
  }

  async findByDateAndId(date: string, id: string) {
    return await this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.date, date), eq(this.table.id, id)))
      .get();
  }

  async deleteByDate(date: string) {
    return await this.db.delete(this.table).where(eq(this.table.date, date)).returning().all();
  }
}

export const historyTasksRepository = new HistoryTasksRepository();
