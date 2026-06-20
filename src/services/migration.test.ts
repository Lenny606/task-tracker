import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tanstack/react-start', () => {
  const fn: any = {
    validator: () => fn,
    handler: (handlerFn: any) => handlerFn,
  };
  return {
    __esModule: true,
    createServerFn: () => fn,
  };
});

const mockSaveSettings = vi.fn();
const mockCreateTask = vi.fn();
const mockSaveMetrics = vi.fn();

vi.mock('../repositories/settings.repository', () => ({
  settingsRepository: {
    saveSettings: (...args: any[]) => mockSaveSettings(...args),
  },
}));

vi.mock('../repositories/historyTasks.repository', () => ({
  historyTasksRepository: {
    create: (...args: any[]) => mockCreateTask(...args),
  },
}));

vi.mock('../repositories/dayMetrics.repository', () => ({
  dayMetricsRepository: {
    saveMetrics: (...args: any[]) => mockSaveMetrics(...args),
  },
}));

import { migrateLocalStorageFn } from './migration';

describe('migration service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw an error if no migration data is provided', async () => {
    await expect((migrateLocalStorageFn as any)({} as any)).rejects.toThrow('Missing migration data');
  });

  it('should call saveSettings if settings are provided', async () => {
    const payload = {
      settings: {
        aiModel: 'gpt-4',
        jiraApiKey: 'api-key',
        jiraEmail: 'email@example.com',
        jiraTempoApiKey: 'tempo-key',
        jiraUrl: 'https://example.atlassian.net',
      },
    };

    mockSaveSettings.mockResolvedValue(undefined);

    const result = await (migrateLocalStorageFn as any)({ data: payload });
    expect(result).toEqual({ success: true });
    expect(mockSaveSettings).toHaveBeenCalledWith({
      aiModel: 'gpt-4',
      jiraApiKey: 'api-key',
      jiraEmail: 'email@example.com',
      jiraTempoApiKey: 'tempo-key',
      jiraUrl: 'https://example.atlassian.net',
    });
  });

  it('should migrate history data including metrics and tasks', async () => {
    const payload = {
      settings: null,
      history: {
        '2026-06-02': {
          aiSummary: 'A good day',
          globalTimer: {
            totalSeconds: 3600,
            isRunning: true,
            startTime: 1774895000000,
          },
          tasks: [
            {
              id: 'task-1',
              name: 'Refactor code',
              jiraKey: 'PROJ-1',
              jiraSummary: 'Refactoring task',
              totalSeconds: 1800,
              isRunning: false,
              isMarked: true,
              startTime: 1774895000000,
            },
          ],
        },
      },
    };

    mockSaveMetrics.mockResolvedValue({ id: 45 });
    mockCreateTask.mockResolvedValue(undefined);

    const result = await (migrateLocalStorageFn as any)({ data: payload });
    expect(result).toEqual({ success: true });

    expect(mockSaveMetrics).toHaveBeenCalledWith('2026-06-02', {
      aiSummary: 'A good day',
      timerTotalSeconds: 3600,
      timerIsRunning: true,
      timerStartTime: new Date(1774895000000),
    });

    expect(mockCreateTask).toHaveBeenCalledWith({
      id: 'task-1',
      dayMetricId: 45,
      date: '2026-06-02',
      name: 'Refactor code',
      jiraKey: 'PROJ-1',
      jiraSummary: 'Refactoring task',
      totalSeconds: 1800,
      isRunning: false,
      isMarked: true,
      startTime: new Date(1774895000000),
    });
  });
});
