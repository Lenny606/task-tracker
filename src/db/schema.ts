import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const settings = sqliteTable('settings', {
  id: text('id').primaryKey(), // Using text IDs (e.g., 'app-settings')
  aiModel: text('ai_model').notNull().default('gemini-2.5-flash'),
  jiraApiKey: text('jira_api_key').notNull().default(''),
  jiraEmail: text('jira_email').notNull().default(''),
  jiraTempoApiKey: text('jira_tempo_api_key').notNull().default(''),
  jiraUrl: text('jira_url').notNull().default(''),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(new Date(0)),
});

export const worklogs = sqliteTable('worklogs', {
  id: text('id').primaryKey(),
  jiraIssueKey: text('jira_issue_key').notNull(),
  summary: text('summary').notNull(),
  timeSpentSeconds: integer('time_spent_seconds').notNull(),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  comment: text('comment'),
  syncedToJira: integer('synced_to_jira', { mode: 'boolean' }).notNull().default(false),
  jiraWorklogId: text('jira_worklog_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(), // Jira project ID
  key: text('key').notNull(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  lastSyncedAt: integer('last_synced_at', { mode: 'timestamp' }),
});

export const historyTasks = sqliteTable('history_tasks', {
  id: text('id').primaryKey(),
  dayMetricId: integer('day_metric_id').references(() => dayMetrics.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD
  name: text('name').notNull(),
  jiraKey: text('jira_key'),
  jiraSummary: text('jira_summary'),
  totalSeconds: integer('total_seconds').notNull().default(0),
  isRunning: integer('is_running', { mode: 'boolean' }).notNull().default(false),
  isMarked: integer('is_marked', { mode: 'boolean' }).notNull().default(false),
  startTime: integer('start_time', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(new Date()),
});

export const dayMetrics = sqliteTable('day_metrics', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  aiSummary: text('ai_summary'),
  timerTotalSeconds: integer('timer_total_seconds').notNull().default(0),
  timerIsRunning: integer('timer_is_running', { mode: 'boolean' }).notNull().default(false),
  timerStartTime: integer('timer_start_time', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(new Date()),
});
