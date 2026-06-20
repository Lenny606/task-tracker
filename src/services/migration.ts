import { createServerFn } from '@tanstack/react-start';
import { historyTasksRepository } from '../repositories/historyTasks.repository';
import { dayMetricsRepository } from '../repositories/dayMetrics.repository';
import { settingsRepository } from '../repositories/settings.repository';

interface MigrationPayload {
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

async function migrateSettings(settings: any) {
  if (!settings) return;
  console.log('[Migration] Migrating settings...');
  await settingsRepository.saveSettings({
    aiModel: settings.aiModel,
    jiraApiKey: settings.jiraApiKey,
    jiraEmail: settings.jiraEmail,
    jiraTempoApiKey: settings.jiraTempoApiKey,
    jiraUrl: settings.jiraUrl,
  });
}

async function migrateTask(task: any, date: string, dayMetricId?: number) {
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

async function migrateDayData(date: string, dayData: any) {
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

  if (dayData.tasks && Array.isArray(dayData.tasks)) {
    for (const task of dayData.tasks) {
      await migrateTask(task, date, dayMetricId);
    }
  }
}

export const migrateLocalStorageFn = createServerFn({
  method: 'POST',
}).handler(async ({ data }: { data?: MigrationPayload }) => {
  if (!data) throw new Error('Missing migration data');

  console.log('[Migration] Starting migration to SQLite...');

  await migrateSettings(data.settings);

  if (data.history) {
    console.log('[Migration] Migrating history data...');
    for (const [date, dayData] of Object.entries(data.history)) {
      await migrateDayData(date, dayData);
    }
  }

  console.log('[Migration] Migration complete!');
  return { success: true };
});
