import { settings } from '../db/schema';
import { BaseRepository } from './base.repository';
import { eq } from 'drizzle-orm';

export class SettingsRepository extends BaseRepository<typeof settings> {
  constructor() {
    super(settings);
  }

  /**
   * Get the singleton application settings
   */
  async getSettings() {
    return await this.db.select().from(this.table).where(eq(this.table.id, 'app-settings')).get();
  }

  /**
   * Save or update settings
   */
  async saveSettings(data: Partial<typeof settings.$inferInsert>) {
    const existing = await this.getSettings();
    const now = new Date();

    if (existing) {
      return await this.update('app-settings', { ...data, updatedAt: now });
    } else {
      return await this.create({
        ...data,
        id: 'app-settings',
        updatedAt: now,
      });
    }
  }
}

// Singleton instance
export const settingsRepository = new SettingsRepository();
