import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub environment before any service imports
vi.stubGlobal('fetch', vi.fn());

const mockSettings = {
  aiProvider: 'gemini',
  aiModel: 'gemini-2.5-flash',
  geminiApiKey: 'test-gemini-key',
  openaiApiKey: 'test-openai-key',
  jiraUrl: 'https://mock.atlassian.net',
  jiraEmail: 'mock@example.com',
  jiraApiKey: 'mock-jira-key',
  jiraTempoApiKey: 'mock-tempo-key',
};

// Mock the repositories
vi.mock('../repositories/settings.repository', () => ({
  settingsRepository: {
    getSettings: async () => mockSettings,
  }
}));

vi.mock('../repositories/trackerProject.repository', () => ({
  trackerProjectRepository: {
    findAll: async () => [{ id: 'proj-1', name: 'Task Tracker' }]
  }
}));

vi.mock('../repositories/historyTasks.repository', () => ({
  historyTasksRepository: {
    findAll: async () => [],
    findByDate: async (date: string) => [{ id: 'task-1', date, name: 'Task 1', totalSeconds: 1200 }],
    findByDateRange: async (startDate: string, endDate: string) => [
      { id: 'task-range-1', date: startDate, name: 'Task Range 1', totalSeconds: 1800 }
    ],
    findByDateAndId: async () => null,
    create: async (data: any) => data,
    update: async (id: string, data: any) => data,
    delete: async (id: string) => ({ success: true }),
  }
}));

vi.mock('../repositories/dayMetrics.repository', () => ({
  dayMetricsRepository: {
    findAll: async () => [],
    findByDate: async (date: string) => ({ date, aiSummary: 'Done' }),
    saveMetrics: async (date: string, data: any) => ({ date, ...data }),
    delete: async (date: string) => ({ success: true }),
  }
}));

// Mock JIRA service
vi.mock('./jira', () => ({
  jiraService: {
    getMyself: async () => ({ accountId: 'acc-123' }),
    searchIssues: async (creds: any, jql: string, maxResults?: number) => [
      { id: '10001', key: 'TEST-1', summary: 'Search Match' }
    ],
    createIssue: async (creds: any, data: any) => ({ id: '10002', key: 'TEST-2' }),
    getIssue: async (creds: any, issueKey: string) => ({ key: issueKey, summary: 'Issue details' }),
    logWork: async (creds: any, data: any) => ({ success: true, id: 'worklog-10' }),
    deleteWorklog: async (creds: any, id: number) => ({ success: true }),
    getWorklogs: async (creds: any, from: string, to: string, authorAccountId: string) => [
      { tempoWorklogId: 'worklog-10', timeSpentSeconds: 3600 }
    ],
  }
}));

import {
  mapMessagesToGemini,
  mapMessagesToOpenAI,
  toolRegistry,
  runAgentLoop,
  ChatMessage
} from './agentService';

describe('agentService Translation Mappers', () => {
  it('mapMessagesToGemini should translate user and model turns, grouping consecutive tool responses', () => {
    const input: ChatMessage[] = [
      { role: 'system', content: 'system-prompt' },
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'how can I help?', tool_calls: [{ name: 'task_get_all', arguments: {} }] },
      { role: 'tool', name: 'task_get_all', tool_call_id: 'call_1', content: '[]' },
      { role: 'tool', name: 'tracker_get_projects', tool_call_id: 'call_2', content: '[]' }
    ];

    const result = mapMessagesToGemini(input);

    // system message is skipped (handles by caller systemInstruction parameter)
    expect(result).toHaveLength(3);
    
    // First message: user hello
    expect(result[0]).toEqual({ role: 'user', parts: [{ text: 'hello' }] });
    
    // Second message: model assistant and functionCalls
    expect(result[1]).toEqual({
      role: 'model',
      parts: [
        { text: 'how can I help?' },
        { functionCalls: [{ name: 'task_get_all', args: {} }] }
      ]
    });

    // Third message: user containing BOTH consecutive tool responses grouped
    expect(result[2].role).toBe('user');
    expect(result[2].parts).toHaveLength(2);
    expect(result[2].parts[0].functionResponse.name).toBe('task_get_all');
    expect(result[2].parts[1].functionResponse.name).toBe('tracker_get_projects');
  });

  it('mapMessagesToOpenAI should map messages with standard tool_call_id generation', () => {
    const input: ChatMessage[] = [
      { role: 'system', content: 'system-prompt' },
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi', tool_calls: [{ name: 'task_get_all', arguments: {} }] },
      { role: 'tool', name: 'task_get_all', tool_call_id: 'call_123', content: '[]' }
    ];

    const result = mapMessagesToOpenAI(input);

    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ role: 'system', content: 'system-prompt' });
    expect(result[2].role).toBe('assistant');
    expect(result[2].tool_calls).toBeDefined();
    expect(result[2].tool_calls[0].function.name).toBe('task_get_all');
    expect(result[3]).toEqual({
      role: 'tool',
      tool_call_id: 'call_123',
      name: 'task_get_all',
      content: '[]'
    });
  });
});

describe('agentService Tool Registry Handlers', () => {
  const creds = {
    url: 'https://mock.atlassian.net',
    email: 'mock@example.com',
    apiKey: 'mock-jira-key',
    tempoApiKey: 'mock-tempo-key',
  };

  it('tracker_get_projects should return projects', async () => {
    const result = await toolRegistry.tracker_get_projects({}, creds);
    expect(result).toEqual([{ id: 'proj-1', name: 'Task Tracker' }]);
  });

  it('task_get_all should accept date parameter', async () => {
    const result = await toolRegistry.task_get_all({ date: '2026-05-31' }, creds);
    expect(result[0].name).toBe('Task 1');
  });

  it('task_get_all should accept startDate and endDate parameters for range filtering', async () => {
    const result = await toolRegistry.task_get_all({ startDate: '2026-05-01', endDate: '2026-05-31' }, creds);
    expect(result[0].name).toBe('Task Range 1');
    expect(result[0].date).toBe('2026-05-01');
  });

  it('task_create_or_update should return created task', async () => {
    const result = await toolRegistry.task_create_or_update({
      date: '2026-05-31',
      task: { name: 'New task', isRunning: true }
    }, creds);
    expect(result.name).toBe('New task');
    expect(result.isRunning).toBe(true);
    expect(result.id).toBeDefined();
  });

  it('jira_search_issues should search with mandatory Task filter', async () => {
    const result = await toolRegistry.jira_search_issues({ jql: 'project = TS' }, creds);
    expect(result[0].key).toBe('TEST-1');
  });

  it('jira_log_work should log to Tempo after fetching authorAccountId', async () => {
    const result = await toolRegistry.jira_log_work({
      issueKey: 'TS-12',
      timeSpentSeconds: 3600,
      description: 'Worked on something',
      startDate: '2026-05-31'
    }, creds);
    expect(result.success).toBe(true);
  });
});

describe('agentService runAgentLoop Multi-Turn Stream Execution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should process Gemini SSE stream and trigger events for text, tool calls, results and done', async () => {
    mockSettings.aiProvider = 'gemini';

    // Mock Gemini SSE fetch streaming response:
    // First chunk yields text, second yields function call, next loop finishes.
    const textDecoder = new TextDecoder('utf-8');
    const mockChunks = [
      'data: {"candidates": [{"content": {"parts": [{"text": "Hello! I am running a tool for you."}]}}]}\n',
      'data: {"candidates": [{"content": {"parts": [{"functionCalls": [{"name": "tracker_get_projects", "args": {}}]}]}}]}\n'
    ];

    const stream = new ReadableStream({
      start(controller) {
        mockChunks.forEach(chunk => {
          controller.enqueue(new TextEncoder().encode(chunk));
        });
        controller.close();
      }
    });

    // Loop execution 2 (second assistant call) - no tools called, ends the loop
    const emptyStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"candidates": [{"content": {"parts": [{"text": "Done!"}]}}]}\n'));
        controller.close();
      }
    });

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        body: stream,
      } as any)
      .mockResolvedValueOnce({
        ok: true,
        body: emptyStream,
      } as any);

    const events: any[] = [];
    const messages: ChatMessage[] = [
      { role: 'user', content: 'What projects do I have?' }
    ];

    await runAgentLoop(messages, (event) => {
      events.push(event);
    });

    // Check captured events
    expect(events.length).toBeGreaterThan(0);
    
    // Check text events
    const textEvents = events.filter(e => e.type === 'text');
    expect(textEvents[0].delta).toBe('Hello! I am running a tool for you.');

    // Check tool_call event
    const callEvent = events.find(e => e.type === 'tool_call');
    expect(callEvent).toBeDefined();
    expect(callEvent.name).toBe('tracker_get_projects');

    // Check tool_result event
    const resultEvent = events.find(e => e.type === 'tool_result');
    expect(resultEvent).toBeDefined();
    expect(resultEvent.name).toBe('tracker_get_projects');
    expect(resultEvent.result).toEqual([{ id: 'proj-1', name: 'Task Tracker' }]);

    // Check done event
    const doneEvent = events.find(e => e.type === 'done');
    expect(doneEvent).toBeDefined();
  });
});
