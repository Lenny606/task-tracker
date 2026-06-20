import { randomUUID } from 'node:crypto';
import { historyTasksRepository } from '../repositories/historyTasks.repository';
import { dayMetricsRepository } from '../repositories/dayMetrics.repository';
import { trackerProjectRepository } from '../repositories/trackerProject.repository';
import { jiraService, type JiraCredentials } from './jira';
import { settingsRepository } from '../repositories/settings.repository';
import { agentLogger } from '../utils/agentLogger';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
}

// 1. Unified Tool Schemas
const tools: ToolDefinition[] = [
  // Local Database Projects Tool
  {
    name: 'tracker_get_projects',
    description: 'Retrieve all local projects defined in the task tracker database.',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  // Local Database Task Tools
  {
    name: 'task_get_all',
    description: 'Retrieve local tasks from the task tracker database. Can filter by a specific YYYY-MM-DD date, or a range using startDate and endDate.',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Optional specific date to filter tasks in YYYY-MM-DD format (e.g., 2026-05-31)'
        },
        startDate: {
          type: 'string',
          description: 'Optional start date for filtering a range in YYYY-MM-DD format (inclusive)'
        },
        endDate: {
          type: 'string',
          description: 'Optional end date for filtering a range in YYYY-MM-DD format (inclusive)'
        }
      },
      required: []
    }
  },
  {
    name: 'task_create_or_update',
    description: 'Create a new local task or update an existing local task in the tracker database.',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'The date for the task in YYYY-MM-DD format'
        },
        task: {
          type: 'object',
          description: 'Properties of the task to save',
          properties: {
            id: {
              type: 'string',
              description: 'The unique ID of the task (omit or leave empty to create a new task)'
            },
            name: {
              type: 'string',
              description: 'Name or description of the task'
            },
            jiraKey: {
              type: 'string',
              description: 'Associated JIRA issue key (optional)'
            },
            jiraSummary: {
              type: 'string',
              description: 'Associated JIRA issue summary (optional)'
            },
            trackerProjectId: {
              type: 'string',
              description: 'Local project ID to associate this task with (optional)'
            },
            totalSeconds: {
              type: 'integer',
              description: 'Total elapsed time in seconds (optional)'
            },
            isRunning: {
              type: 'boolean',
              description: 'Whether the task timer is currently active/running (optional)'
            },
            isMarked: {
              type: 'boolean',
              description: 'Whether the task is pinned/marked (optional)'
            },
            startTime: {
              type: 'integer',
              description: 'Start epoch timestamp in milliseconds (optional)'
            }
          },
          required: ['name']
        }
      },
      required: ['date', 'task']
    }
  },
  {
    name: 'task_delete',
    description: 'Delete a local tracker task by its unique ID.',
    parameters: {
      type: 'object',
      properties: {
        taskId: {
          type: 'string',
          description: 'The UUID of the local task to delete'
        }
      },
      required: ['taskId']
    }
  },
  {
    name: 'task_get_day_metrics',
    description: 'Retrieve day metrics (global timer status, AI-generated work summary) for a specific date or all dates.',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Optional date in YYYY-MM-DD format. If omitted, returns metrics for all dates.'
        }
      },
      required: []
    }
  },
  {
    name: 'task_update_day_metrics',
    description: 'Update the AI summary or global timer metrics for a specific date.',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'The date in YYYY-MM-DD format'
        },
        aiSummary: {
          type: 'string',
          description: 'AI generated summary of the day\'s work (optional)'
        },
        timerTotalSeconds: {
          type: 'integer',
          description: 'Global timer total seconds (optional)'
        },
        timerIsRunning: {
          type: 'boolean',
          description: 'Whether the global timer is running (optional)'
        },
        timerStartTime: {
          type: 'integer',
          description: 'Global timer start epoch timestamp in milliseconds (optional)'
        }
      },
      required: ['date']
    }
  },
  {
    name: 'task_delete_day',
    description: 'Delete all local tasks and metrics for a specific date.',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'The date to clear in YYYY-MM-DD format'
        }
      },
      required: ['date']
    }
  },
  // External JIRA & Tempo Tools
  {
    name: 'jira_search_issues',
    description: 'Search for JIRA issues using JQL (Jira Query Language).',
    parameters: {
      type: 'object',
      properties: {
        jql: {
          type: 'string',
          description: 'JIRA JQL query (e.g., project = "TS" AND status = "In Progress")'
        },
        maxResults: {
          type: 'integer',
          description: 'Maximum number of issues to return (optional, default: 50)'
        }
      },
      required: ['jql']
    }
  },
  {
    name: 'jira_create_issue',
    description: 'Create a new JIRA issue.',
    parameters: {
      type: 'object',
      properties: {
        projectKey: {
          type: 'string',
          description: 'JIRA project key (e.g., TS)'
        },
        summary: {
          type: 'string',
          description: 'Brief summary / title of the issue'
        },
        description: {
          type: 'string',
          description: 'Detailed description of the issue'
        },
        issueTypeName: {
          type: 'string',
          description: 'Issue type name (e.g., Task, Bug, Story)'
        }
      },
      required: ['projectKey', 'summary', 'description', 'issueTypeName']
    }
  },
  {
    name: 'jira_get_issue',
    description: 'Get details (summary, key, project) of a JIRA issue by key or ID.',
    parameters: {
      type: 'object',
      properties: {
        issueIdOrKey: {
          type: 'string',
          description: 'The JIRA issue key (e.g., TS-45) or numeric ID'
        }
      },
      required: ['issueIdOrKey']
    }
  },
  {
    name: 'jira_log_work',
    description: 'Log time/work to a JIRA ticket using Tempo API v4.',
    parameters: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'JIRA issue key (e.g., TS-45)'
        },
        timeSpentSeconds: {
          type: 'integer',
          description: 'Time spent in seconds (e.g., 3600 for 1h, 7200 for 2h)'
        },
        description: {
          type: 'string',
          description: 'Description of the work logged'
        },
        startDate: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (e.g., 2026-05-31)'
        }
      },
      required: ['issueKey', 'timeSpentSeconds', 'description', 'startDate']
    }
  },
  {
    name: 'jira_delete_worklog',
    description: 'Delete a logged worklog entry by its numeric ID using Tempo API v4.',
    parameters: {
      type: 'object',
      properties: {
        worklogId: {
          type: 'integer',
          description: 'The numeric ID of the worklog to delete'
        }
      },
      required: ['worklogId']
    }
  },
  {
    name: 'jira_get_worklogs',
    description: 'Fetch all Tempo worklogs logged by the user within a date range.',
    parameters: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format'
        },
        to: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format'
        }
      },
      required: ['from', 'to']
    }
  }
];

// Helper to ensure JIRA credentials are fully configured
function ensureJiraCredentials(creds: Partial<JiraCredentials>): JiraCredentials {
  if (!creds.url || !creds.email || !creds.apiKey) {
    throw new Error('Jira is not configured. Please add your Jira URL, Email, and API Key in Settings.');
  }
  return creds as JiraCredentials;
}

// 2. Tool Execution Registry
export const toolRegistry: Record<string, (args: any, creds: Partial<JiraCredentials>) => Promise<any>> = {
  // Local Database Operations
  tracker_get_projects: async () => {
    return await trackerProjectRepository.findAll();
  },
  task_get_all: async (args) => {
    if (args.date) {
      return await historyTasksRepository.findByDate(args.date);
    }
    if (args.startDate || args.endDate) {
      const start = args.startDate || '1970-01-01';
      const end = args.endDate || new Date().toISOString().split('T')[0];
      return await historyTasksRepository.findByDateRange(start, end);
    }
    return await historyTasksRepository.findAll();
  },
  task_create_or_update: async (args) => {
    const { date, task } = args;
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
  },
  task_delete: async (args) => {
    return await historyTasksRepository.delete(args.taskId);
  },
  task_get_day_metrics: async (args) => {
    if (args.date) {
      return await dayMetricsRepository.findByDate(args.date);
    }
    return await dayMetricsRepository.findAll();
  },
  task_update_day_metrics: async (args) => {
    const { date, ...metrics } = args;
    const saveObj: any = {};
    if (metrics.aiSummary !== undefined) saveObj.aiSummary = metrics.aiSummary;
    if (metrics.timerTotalSeconds !== undefined) saveObj.timerTotalSeconds = metrics.timerTotalSeconds;
    if (metrics.timerIsRunning !== undefined) saveObj.timerIsRunning = metrics.timerIsRunning;
    if (metrics.timerStartTime !== undefined) {
      saveObj.timerStartTime = metrics.timerStartTime ? new Date(metrics.timerStartTime) : null;
    }
    return await dayMetricsRepository.saveMetrics(date, saveObj);
  },
  task_delete_day: async (args) => {
    await historyTasksRepository.deleteByDate(args.date);
    await dayMetricsRepository.delete(args.date);
    return { success: true };
  },

  // Jira Operations
  jira_search_issues: async (args, creds) => {
    const validated = ensureJiraCredentials(creds);
    const filteredJql = `(${args.jql}) AND issuetype in (Task, Epic, "Sub-task", Story)`;
    return await jiraService.searchIssues(validated, filteredJql, args.maxResults);
  },
  jira_create_issue: async (args, creds) => {
    const validated = ensureJiraCredentials(creds);
    return await jiraService.createIssue(validated, args);
  },
  jira_get_issue: async (args, creds) => {
    const validated = ensureJiraCredentials(creds);
    return await jiraService.getIssue(validated, args.issueIdOrKey);
  },
  jira_log_work: async (args, creds) => {
    const validated = ensureJiraCredentials(creds);
    // Tempo v4 requires the user's account ID
    const myself = await jiraService.getMyself(validated);
    const authorAccountId = myself.accountId;
    if (!authorAccountId) {
      throw new Error('Could not retrieve Jira account ID');
    }

    const enhancedWorklogData = {
      ...args,
      authorAccountId,
      syncedToJira: true,
    };

    return await jiraService.logWork(validated, enhancedWorklogData);
  },
  jira_delete_worklog: async (args, creds) => {
    const validated = ensureJiraCredentials(creds);
    return await jiraService.deleteWorklog(validated, args.worklogId);
  },
  jira_get_worklogs: async (args, creds) => {
    const validated = ensureJiraCredentials(creds);
    const myself = await jiraService.getMyself(validated);
    const authorAccountId = myself.accountId;
    if (!authorAccountId) {
      throw new Error('Could not retrieve Jira account ID');
    }
    return await jiraService.getWorklogs(validated, args.from, args.to, authorAccountId);
  }
};

// Convert camelCase or standard OpenAPI schemas to Capitalized types for Gemini
function convertSchemaToGemini(schema: any): any {
  if (!schema) return schema;
  const newSchema = { ...schema };
  if (typeof newSchema.type === 'string') {
    newSchema.type = newSchema.type.toUpperCase();
  }
  if (newSchema.properties) {
    const newProps: Record<string, any> = {};
    for (const [key, val] of Object.entries(newSchema.properties)) {
      newProps[key] = convertSchemaToGemini(val);
    }
    newSchema.properties = newProps;
  }
  if (newSchema.items) {
    newSchema.items = convertSchemaToGemini(newSchema.items);
  }
  return newSchema;
}

// 3. Message History Mappers

export function mapMessagesToGemini(messages: ChatMessage[]): any[] {
  const contents: any[] = [];
  let i = 0;
  while (i < messages.length) {
    const msg = messages[i];
    if (msg.role === 'system') {
      i++;
      continue;
    }
    if (msg.role === 'user') {
      contents.push({
        role: 'user',
        parts: [{ text: msg.content }]
      });
      i++;
    } else if (msg.role === 'assistant') {
      const parts: any[] = [];
      if (msg.content) {
        parts.push({ text: msg.content });
      }
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        parts.push({
          functionCalls: msg.tool_calls.map(tc => ({
            name: tc.name,
            args: typeof tc.arguments === 'string' ? JSON.parse(tc.arguments) : tc.arguments
          }))
        });
      }
      contents.push({ role: 'model', parts });
      i++;
    } else if (msg.role === 'tool') {
      // Group consecutive tool responses into a single 'user' message turn
      const parts: any[] = [];
      while (i < messages.length && messages[i].role === 'tool') {
        const toolMsg = messages[i];
        let responseObj: any = { success: true };
        try {
          responseObj = typeof toolMsg.content === 'string' ? JSON.parse(toolMsg.content) : toolMsg.content;
        } catch (e) {
          responseObj = { error: toolMsg.content };
        }
        parts.push({
          functionResponse: {
            name: toolMsg.name,
            response: responseObj
          }
        });
        i++;
      }
      contents.push({ role: 'user', parts });
    }
  }
  return contents;
}

export function mapMessagesToOpenAI(messages: ChatMessage[]): any[] {
  const openAIMessages: any[] = [];
  messages.forEach(msg => {
    if (msg.role === 'system') {
      openAIMessages.push({ role: 'system', content: msg.content });
    } else if (msg.role === 'user') {
      openAIMessages.push({ role: 'user', content: msg.content });
    } else if (msg.role === 'assistant') {
      const openAiMsg: any = { role: 'assistant', content: msg.content || null };
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        openAiMsg.tool_calls = msg.tool_calls.map(tc => ({
          id: tc.id || `call_${randomUUID().replace(/-/g, '')}`,
          type: 'function',
          function: {
            name: tc.name,
            arguments: typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments)
          }
        }));
      }
      openAIMessages.push(openAiMsg);
    } else if (msg.role === 'tool') {
      openAIMessages.push({
        role: 'tool',
        tool_call_id: msg.tool_call_id || 'call_default',
        name: msg.name,
        content: msg.content
      });
    }
  });
  return openAIMessages;
}

// 4. Backend Multi-Turn Loop Runner

async function loadAgentSettings() {
  const settings = await settingsRepository.getSettings();
  if (!settings) {
    throw new Error('Application settings not found in database.');
  }
  return settings;
}

function parseGeminiChunk(
  line: string,
  toolCalls: any[],
  onEvent: (event: any) => void
): string {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return '';
  const jsonStr = trimmed.substring(5).trim();
  if (!jsonStr) return '';

  try {
    const data = JSON.parse(jsonStr);
    const part = data.candidates?.[0]?.content?.parts?.[0];
    let content = '';

    if (part?.text) {
      content = part.text;
      onEvent({ type: 'text', delta: part.text });
    }

    if (part?.functionCalls && part.functionCalls.length > 0) {
      for (const fc of part.functionCalls) {
        toolCalls.push({
          id: `call_${randomUUID().replace(/-/g, '')}`,
          name: fc.name,
          arguments: fc.args
        });
      }
    }
    return content;
  } catch (err) {
    return '';
  }
}

async function streamGeminiResponse(
  apiKey: string,
  model: string,
  systemPrompt: string,
  activeMessages: ChatMessage[],
  onEvent: (event: any) => void
): Promise<{ content: string; toolCalls: any[] }> {
  const geminiTools = tools.map(t => ({
    name: t.name,
    description: t.description,
    parameters: convertSchemaToGemini(t.parameters)
  }));

  const contents = mapMessagesToGemini(activeMessages);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
  if (!url.startsWith('https://generativelanguage.googleapis.com/')) {
    throw new Error('Blocked SSRF attempt: Invalid host');
  }

  // Call Gemini API with streaming SSE
  // fallow-ignore-next-line security-sink
  const response = await fetch(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        tools: [{ functionDeclarations: geminiTools }]
      })
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errText}`);
  }

  const reader = response.body;
  if (!reader) throw new Error('ReadableStream not supported on response.');

  // Decode the stream and split by line (SSE)
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let gatheredContent = '';
  const toolCalls: any[] = [];

  const streamReader = reader.getReader();
  while (true) {
    const { done, value } = await streamReader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      gatheredContent += parseGeminiChunk(line, toolCalls, onEvent);
    }
  }

  // Handle any left-overs in buffer
  if (buffer) {
    gatheredContent += parseGeminiChunk(buffer, toolCalls, onEvent);
  }

  return { content: gatheredContent, toolCalls };
}

function parseOpenAIChunk(
  line: string,
  openAiToolCallsBuffer: Record<number, { id?: string; name?: string; arguments: string }>,
  onEvent: (event: any) => void
): string {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return '';
  const dataStr = trimmed.substring(5).trim();
  if (dataStr === '[DONE]') return '';

  try {
    const parsed = JSON.parse(dataStr);
    const delta = parsed.choices?.[0]?.delta;
    let content = '';

    if (delta?.content) {
      content = delta.content;
      onEvent({ type: 'text', delta: delta.content });
    }

    if (delta?.tool_calls) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index;
        if (!openAiToolCallsBuffer[idx]) {
          openAiToolCallsBuffer[idx] = { arguments: '' };
        }
        if (tc.id) openAiToolCallsBuffer[idx].id = tc.id;
        if (tc.function?.name) openAiToolCallsBuffer[idx].name = tc.function.name;
        if (tc.function?.arguments) openAiToolCallsBuffer[idx].arguments += tc.function.arguments;
      }
    }
    return content;
  } catch (err) {
    return '';
  }
}

async function streamOpenAIResponse(
  apiKey: string,
  model: string,
  activeMessages: ChatMessage[],
  onEvent: (event: any) => void
): Promise<{ content: string; toolCalls: any[] }> {
  const openAiTools = tools.map(t => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }
  }));

  const openaiMessages = mapMessagesToOpenAI(activeMessages);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: openaiMessages,
      stream: true,
      tools: openAiTools
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${errText}`);
  }

  const reader = response.body;
  if (!reader) throw new Error('ReadableStream not supported on response.');

  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let gatheredContent = '';
  const toolCalls: any[] = [];

  const openAiToolCallsBuffer: Record<number, { id?: string; name?: string; arguments: string }> = {};

  const streamReader = reader.getReader();
  while (true) {
    const { done, value } = await streamReader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      gatheredContent += parseOpenAIChunk(line, openAiToolCallsBuffer, onEvent);
    }
  }

  // Reconstruct tools from buffer
  for (const [_, tc] of Object.entries(openAiToolCallsBuffer)) {
    if (tc.name) {
      let parsedArgs = {};
      try {
        parsedArgs = JSON.parse(tc.arguments);
      } catch (e) {
        parsedArgs = tc.arguments;
      }
      toolCalls.push({
        id: tc.id || `call_${randomUUID().replace(/-/g, '')}`,
        name: tc.name,
        arguments: parsedArgs
      });
    }
  }

  return { content: gatheredContent, toolCalls };
}

async function executeToolCalls(
  pendingToolCalls: any[],
  settings: any,
  activeMessages: ChatMessage[],
  onEvent: (event: any) => void
): Promise<void> {
  for (const tc of pendingToolCalls) {
    onEvent({
      type: 'tool_call',
      name: tc.name,
      arguments: tc.arguments
    });

    agentLogger.logToolCall(tc.name, tc.arguments);

    let result: any;
    try {
      const handler = toolRegistry[tc.name];
      if (!handler) {
        throw new Error(`Tool ${tc.name} is not implemented.`);
      }

      // Get current JIRA/Tempo credentials dynamically
      const jiraCreds = {
        url: settings.jiraUrl,
        email: settings.jiraEmail,
        apiKey: settings.jiraApiKey,
        tempoApiKey: settings.jiraTempoApiKey,
      };

      result = await handler(tc.arguments, jiraCreds);
    } catch (err: any) {
      console.error(`[Agent Tool Error] Failed executing ${tc.name}:`, err);
      result = { error: err.message || String(err) };
    }

    onEvent({
      type: 'tool_result',
      name: tc.name,
      result
    });

    agentLogger.logToolResult(tc.name, result);

    // Add tool response to convo history
    activeMessages.push({
      role: 'tool',
      name: tc.name,
      tool_call_id: tc.id,
      content: JSON.stringify(result)
    });
  }
}

export async function runAgentLoop(
  inputMessages: ChatMessage[],
  onEvent: (event: { type: 'text' | 'tool_call' | 'tool_result' | 'error' | 'done'; delta?: string; name?: string; arguments?: any; result?: any; error?: string }) => void
) {
  try {
    // A. Load Settings and API keys from SQLite
    const settings = await loadAgentSettings();

    const provider = settings.aiProvider || 'gemini';
    const model = settings.aiModel || 'gemini-2.5-flash';

    // B. Build the system instruction (injecting current date and capabilities)
    const systemPrompt = `You are an advanced agentic Task and Time Tracking assistant.
Your goal is to help users manage their local tracker tasks and log time to JIRA/Tempo.
Today is ${new Date().toISOString().split('T')[0]}.
You have access to a rich set of tools to query and mutate both the local SQLite database and external JIRA/Tempo APIs.

Guidelines:
1. Always use the provided tools to query or update tasks.
2. When logging work, use 'jira_log_work' (main target!). Confirm details with the user when appropriate.
3. Be professional, structured, and informative. If you run a tool, summarize its outcome nicely.
4. Keep your actions precise. If multiple operations are needed, you can run multiple tools sequentially in the loop.`;

    // Clone inputs and prepend system message
    const activeMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...inputMessages
    ];

    agentLogger.logSessionStart(provider, model, inputMessages, systemPrompt);

    let loopCounter = 0;
    const maxLoops = 5;

    while (loopCounter < maxLoops) {
      loopCounter++;
      let textAndTools: { content: string; toolCalls: any[] };

      if (provider === 'gemini') {
        const apiKey = settings.geminiApiKey || process.env.GEMINI_API_KEY || '';
        if (!apiKey) {
          onEvent({ type: 'error', error: 'Gemini API Key is missing.' });
          return;
        }
        textAndTools = await streamGeminiResponse(apiKey, model, systemPrompt, activeMessages, onEvent);
      } else {
        const apiKey = settings.openaiApiKey || process.env.VITE_OPENAI_API_KEY || '';
        if (!apiKey) {
          onEvent({ type: 'error', error: 'OpenAI API Key is missing.' });
          return;
        }
        textAndTools = await streamOpenAIResponse(apiKey, model, activeMessages, onEvent);
      }

      // Add model's turn to conversation history
      activeMessages.push({
        role: 'assistant',
        content: textAndTools.content,
        tool_calls: textAndTools.toolCalls.length > 0 ? textAndTools.toolCalls : undefined
      });

      // C. Execute all pending tool calls
      if (textAndTools.toolCalls.length > 0) {
        await executeToolCalls(textAndTools.toolCalls, settings, activeMessages, onEvent);
      } else {
        // If no tools were called, the loop finishes!
        break;
      }
    }

    // Finished execution successfully
    const finalAssistantMsg = [...activeMessages].reverse().find(m => m.role === 'assistant' && !m.tool_calls);
    if (finalAssistantMsg) {
      agentLogger.logAssistantResponse(finalAssistantMsg.content);
    }
    onEvent({ type: 'done' });
  } catch (err: any) {
    agentLogger.logError(err);
    onEvent({ type: 'error', error: err.message || String(err) });
  }
}
