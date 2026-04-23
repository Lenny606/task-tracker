import { createServerFn } from '@tanstack/react-start';
import { historyTasksRepository } from '../repositories/historyTasks.repository';
import { dayMetricsRepository } from '../repositories/dayMetrics.repository';
import { settingsRepository } from '../repositories/settings.repository';

export interface MigrationPayload {
  settings?: any;
  history?: {
    [date: string]: {
      tasks: any[];
      globalTimer?: {
        totalSeconds: number;
        isRunning: boolean;
        startTime?: number;
      };
      aiSummary?: string;
    }
  };
}

export const migrateLocalStorageFn = createServerFn({
  method: 'POST',
}).handler(async ({ data }: { data: MigrationPayload }) => {
  if (!data) throw new Error('Missing migration data');

  console.log('[Migration] Starting migration to SQLite...');

  // 1. Migrate Settings
  if (data.settings) {
    console.log('[Migration] Migrating settings...');
    await settingsRepository.saveSettings({
      aiModel: data.settings.aiModel,
      jiraApiKey: data.settings.jiraApiKey,
      jiraEmail: data.settings.jiraEmail,
      jiraTempoApiKey: data.settings.jiraTempoApiKey,
      jiraUrl: data.settings.jiraUrl,
    });
  }

  // 2. Migrate History
  if (data.history) {
    console.log('[Migration] Migrating history data...');
    for (const [date, dayData] of Object.entries(data.history)) {
      // 2a. Migrate/Create Day Metrics first to get the ID
      let dayMetricId: number | undefined;
      
      const metrics = await dayMetricsRepository.saveMetrics(date, {
        aiSummary: dayData.aiSummary,
        timerTotalSeconds: dayData.globalTimer?.totalSeconds || 0,
        timerIsRunning: dayData.globalTimer?.isRunning || false,
        timerStartTime: dayData.globalTimer?.startTime ? new Date(dayData.globalTimer.startTime) : null,
      });

      if (metrics) {
        dayMetricId = metrics.id;
      }

      // 2b. Migrate Tasks linked to the metric ID
      if (dayData.tasks && Array.isArray(dayData.tasks)) {
        for (const task of dayData.tasks) {
          await historyTasksRepository.create({
            id: task.id,
            dayMetricId: dayMetricId,
            date: date,
            name: task.name,
            jiraKey: task.jiraKey || null,
            jiraSummary: task.jiraSummary || null,
            totalSeconds: task.totalSeconds || 0,
            isRunning: task.isRunning || false,
            isMarked: task.isMarked || false,
            startTime: task.startTime ? new Date(task.startTime) : null,
          });
        }
      }
    }
  }

  console.log('[Migration] Migration complete!');
  return { success: true };
});
