import { dayMetrics } from '../db/schema';
import { BaseRepository } from './base.repository';
import { eq } from 'drizzle-orm';

export class DayMetricsRepository extends BaseRepository<typeof dayMetrics> {
  constructor() {
    super(dayMetrics);
  }

  async findByDate(date: string) {
    return await this.db.select().from(this.table).where(eq(this.table.date, date)).get();
  }

  async saveMetrics(date: string, data: Partial<typeof dayMetrics.$inferInsert>) {
    const existing = await this.findByDate(date);
    const now = new Date();

    if (existing) {
      return await this.db
        .update(this.table)
        .set({ ...data, updatedAt: now })
        .where(eq(this.table.date, date))
        .returning()
        .get();
    } else {
      return await this.db
        .insert(this.table)
        .values({ ...data, date, updatedAt: now } as any)
        .returning()
        .get();
    }
  }
}

export const dayMetricsRepository = new DayMetricsRepository();
