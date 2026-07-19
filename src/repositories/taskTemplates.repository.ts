import { taskTemplates } from '../db/schema';
import { BaseRepository } from './base.repository';
import { asc } from 'drizzle-orm';

class TaskTemplatesRepository extends BaseRepository<typeof taskTemplates> {
  constructor() {
    super(taskTemplates);
  }

  async findAllOrdered() {
    try {
      return await this.db
        .select()
        .from(this.table)
        .orderBy(asc(this.table.sortOrder))
        .all();
    } catch (error) {
      console.error('[DB Error] Failed to find all task templates ordered:', error);
      throw error;
    }
  }
}

export const taskTemplatesRepository = new TaskTemplatesRepository();
