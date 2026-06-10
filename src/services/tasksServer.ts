import { createServerFn } from '@tanstack/react-start';
import { historyTasksRepository } from '../repositories/historyTasks.repository';
import { dayMetricsRepository } from '../repositories/dayMetrics.repository';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const STALE_TIMER_LIMIT_MS = 10 * 60 * 60 * 1000; // cap runaway timers at 10 hours

/**
 * Stops timers that were left running (from a previous day, or for more
 * than 10 hours) and folds the capped elapsed time into their totals.
 * Only touches rows that are actually running — meant to be called
 * explicitly (e.g. once on app start), not as a read side-effect.
 */
export const reconcileTimersFn = createServerFn({
  method: 'POST',
}).handler(async () => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const nowMs = Date.now();
    let reconciledTasks = 0;
    let reconciledTimers = 0;

    const runningTasks = await historyTasksRepository.findRunning();
    for (const task of runningTasks) {
      if (!task.startTime) continue;
      const elapsedMs = nowMs - task.startTime.getTime();
      if (task.date < todayStr || elapsedMs > STALE_TIMER_LIMIT_MS) {
        const elapsedSeconds = Math.floor(Math.min(elapsedMs, STALE_TIMER_LIMIT_MS) / 1000);
        await historyTasksRepository.update(task.id, {
          isRunning: false,
          startTime: null,
          totalSeconds: task.totalSeconds + elapsedSeconds,
        });
        reconciledTasks++;
      }
    }

    const runningMetrics = await dayMetricsRepository.findRunning();
    for (const metric of runningMetrics) {
      if (!metric.timerStartTime) continue;
      const elapsedMs = nowMs - metric.timerStartTime.getTime();
      if (metric.date < todayStr || elapsedMs > STALE_TIMER_LIMIT_MS) {
        const elapsedSeconds = Math.floor(Math.min(elapsedMs, STALE_TIMER_LIMIT_MS) / 1000);
        await dayMetricsRepository.saveMetrics(metric.date, {
          timerIsRunning: false,
          timerStartTime: null,
          timerTotalSeconds: metric.timerTotalSeconds + elapsedSeconds,
        });
        reconciledTimers++;
      }
    }

    return { reconciledTasks, reconciledTimers };
  } catch (error) {
    console.error('[Server Function Error] reconcileTimersFn:', error);
    throw error;
  }
});

export const getHistoryDataFn = createServerFn({
  method: 'GET',
})
  .inputValidator((data: unknown) => z.object({
    from: z.string().optional(),
    to: z.string().optional(),
  }).optional().parse(data))
  .handler(async ({ data }) => {
  try {
    const hasRange = !!(data?.from || data?.to);
    const allTasks = hasRange
      ? await historyTasksRepository.findByDateRange(data?.from ?? '0000-01-01', data?.to ?? '9999-12-31')
      : await historyTasksRepository.findAll();
    const allMetrics = hasRange
      ? await dayMetricsRepository.findByDateRange(data?.from ?? '0000-01-01', data?.to ?? '9999-12-31')
      : await dayMetricsRepository.findAll();

    const history: any = {};

    // Group tasks by date
    allTasks.forEach((task) => {
      if (!history[task.date]) history[task.date] = { tasks: [] };
      history[task.date].tasks.push({
        id: task.id,
        name: task.name,
        jiraKey: task.jiraKey,
        jiraSummary: task.jiraSummary,
        trackerProjectId: task.trackerProjectId,
        totalSeconds: task.totalSeconds,
        isRunning: task.isRunning,
        isMarked: task.isMarked,
        startTime: task.startTime?.getTime(),
      });
    });

    // Add metrics (timer/summary) to each date
    allMetrics.forEach((metric) => {
      if (!history[metric.date]) history[metric.date] = { tasks: [] };
      history[metric.date].aiSummary = metric.aiSummary;
      history[metric.date].globalTimer = {
        totalSeconds: metric.timerTotalSeconds,
        isRunning: metric.timerIsRunning,
        startTime: metric.timerStartTime?.getTime(),
      };
    });

    return history;
  } catch (error) {
    console.error('[Server Function Error] getHistoryDataFn:', error);
    throw error;
  }
});

export const updateTaskFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown) => z.object({
    date: z.string(),
    task: z.object({
      id: z.string().optional(),
      name: z.string(),
      jiraKey: z.string().nullable().optional(),
      jiraSummary: z.string().nullable().optional(),
      trackerProjectId: z.string().nullable().optional(),
      totalSeconds: z.number().optional(),
      isRunning: z.boolean().optional(),
      isMarked: z.boolean().optional(),
      startTime: z.number().nullable().optional(),
    })
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      const { date, task } = data;
      const taskId = task.id || randomUUID();
      const existing = task.id ? await historyTasksRepository.findByDateAndId(date, task.id) : null;

      const taskData = {
        id: taskId,
        date: date,
        name: task.name,
        jiraKey: task.jiraKey || null,
        jiraSummary: task.jiraSummary || null,
        trackerProjectId: task.trackerProjectId || null,
        totalSeconds: task.totalSeconds || 0,
        isRunning: task.isRunning || false,
        isMarked: task.isMarked || false,
        startTime: task.startTime ? new Date(task.startTime) : null,
      };

      if (existing && task.id) {
        return await historyTasksRepository.update(task.id, taskData);
      } else {
        return await historyTasksRepository.create(taskData);
      }
    } catch (error) {
      console.error('[Server Function Error] updateTaskFn:', error);
      throw error;
    }
  });

export const deleteTaskFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown) => z.object({
    taskId: z.string()
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      return await historyTasksRepository.delete(data.taskId);
    } catch (error) {
      console.error('[Server Function Error] deleteTaskFn:', error);
      throw error;
    }
  });

export const updateDayMetricsFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown) => z.object({
    date: z.string(),
    metrics: z.object({
      aiSummary: z.string().nullable().optional(),
      globalTimer: z.object({
        totalSeconds: z.number().optional(),
        isRunning: z.boolean().optional(),
        startTime: z.number().nullable().optional(),
      }).optional()
    })
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      const { date, metrics } = data;
      return await dayMetricsRepository.saveMetrics(date, {
        aiSummary: metrics.aiSummary,
        timerTotalSeconds: metrics.globalTimer?.totalSeconds,
        timerIsRunning: metrics.globalTimer?.isRunning,
        timerStartTime: metrics.globalTimer?.startTime ? new Date(metrics.globalTimer.startTime) : null,
      });
    } catch (error) {
      console.error('[Server Function Error] updateDayMetricsFn:', error);
      throw error;
    }
  });

export const deleteHistoryDayFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown) => z.object({
    date: z.string()
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      await historyTasksRepository.deleteByDate(data.date);
      await dayMetricsRepository.delete(data.date);
      return { success: true };
    } catch (error) {
      console.error('[Server Function Error] deleteHistoryDayFn:', error);
      throw error;
    }
  });
