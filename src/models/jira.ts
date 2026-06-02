import { z } from 'zod'

/**
 * Jira Project Schema
 */
const JiraProjectSchema = z.object({
  id: z.string(),
  key: z.string(),
  name: z.string(),
  avatarUrls: z.record(z.string(), z.string()).optional(),
})

/**
 * Jira Issue Type Schema
 */
const JiraIssueTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  subtask: z.boolean().optional(),
})

/**
 * Jira Issue Schema
 */
const JiraIssueSchema = z.object({
  id: z.string(),
  key: z.string(),
  self: z.string(),
  fields: z.object({
    summary: z.string(),
    status: z.object({
      name: z.string(),
    }),
    project: JiraProjectSchema.pick({ key: true, name: true }),
    issuetype: JiraIssueTypeSchema.pick({ name: true }),
    updated: z.string(),
  }).passthrough(),
})

/**
 * Tempo Worklog Schema
 * Matches the payload for POST /core/3/worklogs
 */
const WorklogSchema = z.object({
  issueId: z.union([z.string(), z.number()]).optional().describe('The internal ID of the issue (required for Tempo v4)'),
  issueKey: z.string().optional().describe('The key of the issue to log work for (e.g. TEST-123)'),
  timeSpentSeconds: z.number().positive().describe('Duration in seconds'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('YYYY-MM-DD format'),
  startTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/).describe('HH:MM:SS format'),
  description: z.string().min(1).describe('Worklog description'),
  authorAccountId: z.string().optional().describe('Jira Account ID of the user'),
})

export type Worklog = z.infer<typeof WorklogSchema>
export type JiraIssue = z.infer<typeof JiraIssueSchema>
