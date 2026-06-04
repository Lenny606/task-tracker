import { createServerFn } from '@tanstack/react-start'
import { jiraService } from './jira'
import { worklogRepository } from '../repositories/worklog.repository'
import { z } from 'zod'

const jiraCredentialsSchema = z.object({
  url: z.string(),
  email: z.string(),
  apiKey: z.string(),
  tempoApiKey: z.string().optional(),
})

/**
 * Server function to get recent unique tickets from database
 */
export const getRecentTicketsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    const recentWorklogs = await worklogRepository.getRecent(50)

    // Extract unique keys and summaries, preserving order (most recent first)
    const uniqueTickets: { key: string; summary: string }[] = []
    const keys = new Set<string>()

    for (const log of recentWorklogs) {
      if (!keys.has(log.jiraIssueKey)) {
        keys.add(log.jiraIssueKey)
        uniqueTickets.push({
          key: log.jiraIssueKey,
          summary: log.summary,
        })
      }
      if (uniqueTickets.length >= 5) break
    }

    return uniqueTickets
  } catch (error) {
    console.error('[Server Function Error] getRecentTicketsFn:', error);
    throw error;
  }
})

/**
 * Server function to search Jira issues
 */
export const searchJiraIssuesFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown) => z.object({
    credentials: jiraCredentialsSchema,
    jql: z.string(),
    maxResults: z.number().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    // Refined search: Only issues of type "Task", "Epic", "Sub-task", and "Story" across all users and statuses
    const filteredJql = `(${data.jql}) AND issuetype in (Task, Epic, "Sub-task", Story)`
    return await jiraService.searchIssues(data.credentials, filteredJql, data.maxResults)
  })



/**
 * Server function to log work via Tempo
 */
export const logTempoWorkloadFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown) => z.object({
    credentials: jiraCredentialsSchema,
    worklogData: z.object({
      id: z.number().optional(),
      tempoWorklogId: z.string().optional(),
      issueKey: z.string().optional(),
      description: z.string().optional(),
      timeSpentSeconds: z.number(),
      startDate: z.string(),
      syncedToJira: z.boolean().optional(),
      trackerProjectId: z.string().nullable().optional(),
    }),
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      // To ensure correct attribution in Tempo v4, we fetch the user's accountId
      const myself = await jiraService.getMyself(data.credentials)
      const authorAccountId = myself.accountId

      if (!authorAccountId) {
        throw new Error('Could not retrieve Jira account ID')
      }

      const enhancedWorklogData = {
        ...data.worklogData,
        authorAccountId,
      }

      const result = await jiraService.logWork(data.credentials, enhancedWorklogData)

      // Save to local database for internal tracking
      if (result && result.id) {
        await worklogRepository.create({
          jiraWorklogId: String(result.id),
          jiraIssueKey: data.worklogData.issueKey || '',
          summary: data.worklogData.description || '',
          timeSpentSeconds: data.worklogData.timeSpentSeconds,
          startedAt: new Date(data.worklogData.startDate),
          syncedToJira: true,
          trackerProjectId: data.worklogData.trackerProjectId,
        })
      }

      return result
    } catch (error) {
      console.error('[Server Function Error] logTempoWorkloadFn:', error);
      throw error;
    }
  })



/**
 * Server function to get Tempo worklogs
 */
export const getTempoWorklogsFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown) => z.object({
    credentials: jiraCredentialsSchema,
    from: z.string(),
    to: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    // Debug log (lengths only for security)
    console.log('[getTempoWorklogsFn] Received credentials:', {
      hasUrl: !!data.credentials.url,
      url: data.credentials.url,
      emailLength: data.credentials.email?.length,
      apiKeyLength: data.credentials.apiKey?.length,
      tempoApiKeyLength: data.credentials.tempoApiKey?.length,
    })

    // First get the account ID of the user
    const myself = await jiraService.getMyself(data.credentials)
    const authorAccountId = myself.accountId

    if (!authorAccountId) {
      throw new Error('Could not retrieve Jira account ID')
    }

    // Then fetch worklogs for that user
    return await jiraService.getWorklogs(data.credentials, data.from, data.to, authorAccountId)
  })

/**
 * Server function to delete a Tempo worklog
 */
export const deleteTempoWorklogFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown) => z.object({
    credentials: jiraCredentialsSchema,
    worklogId: z.number(),
  }).parse(data))
  .handler(async ({ data }) => {
    return await jiraService.deleteWorklog(data.credentials, data.worklogId)
  })
