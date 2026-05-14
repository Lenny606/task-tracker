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
