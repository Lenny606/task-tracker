import { createServerFn } from '@tanstack/react-start'
import { jiraService } from './jira'
import { worklogRepository } from '../repositories/worklog.repository'
import type { JiraCredentials, CreateIssueData, TempoWorklogData } from './jira'

/**
 * Server function to get recent unique tickets from database
 */
export const getRecentTicketsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
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
})

/**
 * Server function to search Jira issues
 */
export const searchJiraIssuesFn = createServerFn({
  method: 'POST',
  // @ts-ignore - Serialization issues with unknown fields
}).handler(async ({ data }: { data?: { credentials: JiraCredentials; jql: string; maxResults?: number } }) => {
  if (!data) throw new Error('Missing input data')
  
  // Apply filtering logic: only issues assigned to or reported by the user
  const myself = await jiraService.getMyself(data.credentials)
  const accountId = myself.accountId
  
  if (!accountId) {
    return await jiraService.searchIssues(data.credentials, data.jql, data.maxResults)
  }

  const filteredJql = `(${data.jql}) AND (assignee = "${accountId}" OR reporter = "${accountId}")`
  return await jiraService.searchIssues(data.credentials, filteredJql, data.maxResults)
})

/**
 * Server function to create a Jira issue
 */
export const createJiraIssueFn = createServerFn({
  method: 'POST',
  // @ts-ignore - Serialization issues with unknown fields
}).handler(async ({ data }: { data?: { credentials: JiraCredentials; issueData: CreateIssueData } }) => {
  if (!data) throw new Error('Missing input data')
  return await jiraService.createIssue(data.credentials, data.issueData)
})

/**
 * Server function to log work via Tempo
 */
export const logTempoWorkloadFn = createServerFn({
  method: 'POST',
}).handler(async ({ data }: { data?: { credentials: JiraCredentials; worklogData: TempoWorklogData } }) => {
  if (!data) throw new Error('Missing input data')

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

  return await jiraService.logWork(data.credentials, enhancedWorklogData)
})

/**
 * Server function to get projects
 */
export const getJiraProjectsFn = createServerFn({
  method: 'GET',
}).handler(async ({ data }: { data?: { credentials: JiraCredentials } }) => {
  if (!data) throw new Error('Missing credentials')
  return await jiraService.getProjects(data.credentials)
})

/**
 * Server function to get current user
 */
export const getJiraMyselfFn = createServerFn({
  method: 'GET',
}).handler(async ({ data }: { data?: { credentials: JiraCredentials } }) => {
  if (!data) throw new Error('Missing credentials')
  return await jiraService.getMyself(data.credentials)
})

/**
 * Server function to get Tempo worklogs
 */
export const getTempoWorklogsFn = createServerFn({
  method: 'POST',
}).handler(async ({ data }: { data?: { credentials: JiraCredentials; from: string; to: string } }) => {
  if (!data) throw new Error('Missing input data')
  
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
