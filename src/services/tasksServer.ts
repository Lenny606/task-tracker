import { createServerFn } from '@tanstack/react-start';
import { historyTasksRepository } from '../repositories/historyTasks.repository';
import { dayMetricsRepository } from '../repositories/dayMetrics.repository';
import { randomUUID } from 'node:crypto';

export const getHistoryDataFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    const allTasks = await historyTasksRepository.findAll();
    const allMetrics = await dayMetricsRepository.findAll();

    const todayStr = new Date().toISOString().split('T')[0];
    const tenHoursMs = 10 * 60 * 60 * 1000;
    const nowMs = Date.now();

    // 1. Reconcile running tasks
    for (const task of allTasks) {
      if (task.isRunning && task.startTime) {
        const startTimeMs = task.startTime.getTime();
        const elapsedMs = nowMs - startTimeMs;
        const isOlderThanToday = task.date < todayStr;
        const exceededTenHours = elapsedMs > tenHoursMs;

        if (isOlderThanToday || exceededTenHours) {
          const sensibleElapsedMs = Math.min(elapsedMs, tenHoursMs);
          const elapsedSeconds = Math.floor(sensibleElapsedMs / 1000);
          const newTotalSeconds = task.totalSeconds + elapsedSeconds;

          await historyTasksRepository.update(task.id, {
            isRunning: false,
            startTime: null,
            totalSeconds: newTotalSeconds,
          });

          task.isRunning = false;
          task.startTime = null;
          task.totalSeconds = newTotalSeconds;
        }
      }
    }

    // 2. Reconcile running day metric timers
    for (const metric of allMetrics) {
      if (metric.timerIsRunning && metric.timerStartTime) {
        const startTimeMs = metric.timerStartTime.getTime();
        const elapsedMs = nowMs - startTimeMs;
        const isOlderThanToday = metric.date < todayStr;
        const exceededTenHours = elapsedMs > tenHoursMs;

        if (isOlderThanToday || exceededTenHours) {
          const sensibleElapsedMs = Math.min(elapsedMs, tenHoursMs);
          const elapsedSeconds = Math.floor(sensibleElapsedMs / 1000);
          const newTotalSeconds = metric.timerTotalSeconds + elapsedSeconds;

          await dayMetricsRepository.saveMetrics(metric.date, {
            timerIsRunning: false,
            timerStartTime: null,
            timerTotalSeconds: newTotalSeconds,
            aiSummary: metric.aiSummary,
          });

          metric.timerIsRunning = false;
          metric.timerStartTime = null;
          metric.timerTotalSeconds = newTotalSeconds;
        }
      }
    }

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
}).handler(async ({ data }: { data: { date: string; task: any } }) => {
  try {
    const { date, task } = data;
    const existing = await historyTasksRepository.findByDateAndId(date, task.id);

    const taskData = {
      id: task.id || randomUUID(),
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

    if (existing) {
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
}).handler(async ({ data }: { data: { taskId: string } }) => {
  try {
    return await historyTasksRepository.delete(data.taskId);
  } catch (error) {
    console.error('[Server Function Error] deleteTaskFn:', error);
    throw error;
  }
});

export const updateDayMetricsFn = createServerFn({
  method: 'POST',
}).handler(async ({ data }: { data: { date: string; metrics: any } }) => {
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
}).handler(async ({ data }: { data: { date: string } }) => {
  try {
    await historyTasksRepository.deleteByDate(data.date);
    await dayMetricsRepository.delete(data.date);
    return { success: true };
  } catch (error) {
    console.error('[Server Function Error] deleteHistoryDayFn:', error);
    throw error;
  }
});
