import { createServerFn } from '@tanstack/react-start'
import { jiraService } from './jira'
import type { JiraCredentials } from './jira'
import { worklogRepository } from '../repositories/worklog.repository'
import { settingsRepository } from '../repositories/settings.repository'
import { z } from 'zod'

/**
 * Loads Jira/Tempo credentials from the server-side settings store.
 * Credentials never travel to or from the client.
 */
async function loadJiraCredentials(): Promise<JiraCredentials> {
  const settings = await settingsRepository.getSettings()
  return {
    url: settings?.jiraUrl || '',
    email: settings?.jiraEmail || '',
    apiKey: settings?.jiraApiKey || '',
    tempoApiKey: settings?.jiraTempoApiKey || '',
  }
}

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
 * Server function to get frequent unique tickets from database
 */
export const getFrequentTicketsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    return await worklogRepository.getFrequent(30)
  } catch (error) {
    console.error('[Server Function Error] getFrequentTicketsFn:', error);
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
    jql: z.string(),
    maxResults: z.number().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    const credentials = await loadJiraCredentials()
    // Refined search: Only issues of type "Task", "Epic", "Sub-task", and "Story" across all users and statuses
    const filteredJql = `(${data.jql}) AND issuetype in (Task, Epic, "Sub-task", Story)`
    return await jiraService.searchIssues(credentials, filteredJql, data.maxResults)
  })



/**
 * Server function to log work via Tempo
 */
export const logTempoWorkloadFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown) => z.object({
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
      const credentials = await loadJiraCredentials()

      // To ensure correct attribution in Tempo v4, we fetch the user's accountId
      const myself = await jiraService.getMyself(credentials)
      const authorAccountId = myself.accountId

      if (!authorAccountId) {
        throw new Error('Could not retrieve Jira account ID')
      }

      const enhancedWorklogData = {
        ...data.worklogData,
        authorAccountId,
      }

      const result = await jiraService.logWork(credentials, enhancedWorklogData)

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
    from: z.string(),
    to: z.string(),
  }).parse(data))
  .handler(async ({ data }) => {
    const credentials = await loadJiraCredentials()

    // First get the account ID of the user
    const myself = await jiraService.getMyself(credentials)
    const authorAccountId = myself.accountId

    if (!authorAccountId) {
      throw new Error('Could not retrieve Jira account ID')
    }

    // Then fetch worklogs for that user
    return await jiraService.getWorklogs(credentials, data.from, data.to, authorAccountId)
  })

/**
 * Server function to delete a Tempo worklog
 */
export const deleteTempoWorklogFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown) => z.object({
    worklogId: z.number(),
  }).parse(data))
  .handler(async ({ data }) => {
    const credentials = await loadJiraCredentials()
    return await jiraService.deleteWorklog(credentials, data.worklogId)
  })
