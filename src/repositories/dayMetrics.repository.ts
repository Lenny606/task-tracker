import { dayMetrics } from '../db/schema';
import { BaseRepository } from './base.repository';
import { eq } from 'drizzle-orm';

export class DayMetricsRepository extends BaseRepository<typeof dayMetrics> {
  constructor() {
    // Note: dayMetrics doesn't have an 'id' column, it uses 'date' as PK.
    // BaseRepository expectes 'id', so we'll slightly deviate or override if needed.
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
