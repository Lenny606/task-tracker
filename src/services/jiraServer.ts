import { createServerFn } from '@tanstack/react-start'
import { jiraService } from './jira'
import type { JiraCredentials, CreateIssueData, TempoWorklogData } from './jira'

/**
 * Server function to search Jira issues
 */
export const searchJiraIssuesFn = createServerFn({
  method: 'POST',
}).handler(async ({ data }: { data?: { credentials: JiraCredentials; jql: string; maxResults?: number } }) => {
  if (!data) throw new Error('Missing input data')
  return await jiraService.searchIssues(data.credentials, data.jql, data.maxResults)
})

/**
 * Server function to create a Jira issue
 */
export const createJiraIssueFn = createServerFn({
  method: 'POST',
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
  return await jiraService.logWork(data.credentials, data.worklogData)
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
