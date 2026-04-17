import type { JiraIssue, Worklog as TempoWorklogData } from '../models/jira'

export type { JiraIssue, TempoWorklogData }

export interface JiraCredentials {
  url: string
  email: string
  apiKey: string
  tempoApiKey?: string
}

export interface CreateIssueData {
  projectKey: string
  summary: string
  description: string
  issueTypeName: string
}

/**
 * Converts a plain string description to Jira's Atlassian Document Format (ADF)
 */
const stringToADF = (text: string) => {
  return {
    type: 'doc',
    version: 1,
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      },
    ],
  }
}

/**
 * Jira API Client
 */
export const jiraClient = {
  fetch: async (creds: JiraCredentials, path: string, options: RequestInit = {}) => {
    if (!creds.url || !creds.email || !creds.apiKey) {
      console.error('[Jira API Error] Missing credentials:', { 
        url: !!creds.url, 
        email: !!creds.email, 
        apiKey: !!creds.apiKey 
      })
      throw new Error('Jira configuration is incomplete. Please check your settings.')
    }

    const url = `${creds.url.replace(/\/$/, '')}${path}`
    
    // Use Buffer for base64 to be safe in both browser (with polyfill if needed) and Node
    const trimmedEmail = creds.email?.trim()
    const trimmedApiKey = creds.apiKey?.trim()
    const authStr = `${trimmedEmail}:${trimmedApiKey}`
    const auth = typeof Buffer !== 'undefined' 
      ? Buffer.from(authStr).toString('base64')
      : btoa(typeof window !== 'undefined' ? unescape(encodeURIComponent(authStr)) : authStr)

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[Jira API Error] ${path}:`, {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: url,
        hasEmail: !!creds.email,
        hasApiKey: !!creds.apiKey,
        apiKeyLength: creds.apiKey?.length,
        authHeader: `Basic ${auth.substring(0, 5)}...`
      })
      throw new Error(`Jira API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  },

  tempoFetch: async (creds: JiraCredentials, path: string, options: RequestInit = {}) => {
    if (!creds.tempoApiKey) throw new Error('Tempo API Key is not configured')

    const url = `https://api.tempo.io${path}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${creds.tempoApiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`[Tempo API Error] ${path}:`, error)
      throw new Error(`Tempo API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  },
}

/**
 * High-level Jira Service
 */
export const jiraService = {
  /**
   * Search for issues using JQL
   */
  searchIssues: async (creds: JiraCredentials, jql: string, maxResults = 50): Promise<JiraIssue[]> => {
    const data = await jiraClient.fetch(creds, `/rest/api/3/search/jql`, {
      method: 'POST',
      body: JSON.stringify({
        jql,
        maxResults,
        fields: ['summary', 'status', 'project', 'issuetype', 'updated'],
      }),
    })
    return data.issues
  },

  /**
   * Create a new issue
   */
  createIssue: async (creds: JiraCredentials, data: CreateIssueData): Promise<JiraIssue> => {
    return await jiraClient.fetch(creds, `/rest/api/3/issue`, {
      method: 'POST',
      body: JSON.stringify({
        fields: {
          project: { key: data.projectKey },
          summary: data.summary,
          issuetype: { name: data.issueTypeName },
          description: stringToADF(data.description),
        },
      }),
    })
  },

  /**
   * Fetch user's accessible projects
   */
  getProjects: async (creds: JiraCredentials): Promise<any[]> => {
    return await jiraClient.fetch(creds, `/rest/api/3/project`)
  },

  /**
   * Fetch current user details
   */
  getMyself: async (creds: JiraCredentials): Promise<any> => {
    return await jiraClient.fetch(creds, `/rest/api/3/myself`)
  },

  /**
   * Fetch a single issue by key or id
   */
  getIssue: async (creds: JiraCredentials, issueIdOrKey: string): Promise<JiraIssue> => {
    return await jiraClient.fetch(creds, `/rest/api/3/issue/${issueIdOrKey}?fields=summary,key,project`)
  },

  /**
   * Log work using Tempo (API v4)
   */
  logWork: async (creds: JiraCredentials, data: TempoWorklogData): Promise<any> => {
    let issueId = data.issueId
    
    // If ID is missing but key is present, resolve it (Tempo v4 requires numeric ID)
    if (!issueId && data.issueKey) {
      try {
        const issue = await jiraService.getIssue(creds, data.issueKey)
        issueId = issue.id
      } catch (error) {
        console.error(`[Jira Service] Failed to auto-resolve issue key ${data.issueKey}:`, error)
        throw new Error(`Could not find Jira issue ${data.issueKey}`)
      }
    }

    if (!issueId) {
      throw new Error('Issue ID is required for Tempo v4')
    }

    const payload = {
      ...data,
      issueId: typeof issueId === 'string' ? parseInt(issueId, 10) : issueId,
    }
    
    // Remove issueKey if present as v4 doesn't use it in payload
    // @ts-ignore
    delete payload.issueKey

    return await jiraClient.tempoFetch(creds, `/4/worklogs`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Fetch worklogs from Tempo (API v4)
   */
  getWorklogs: async (creds: JiraCredentials, from: string, to: string, authorAccountId?: string): Promise<any[]> => {
    let path = `/4/worklogs?from=${from}&to=${to}`
    if (authorAccountId) {
      // v4 uses authorAccountIds (plural)
      path += `&authorAccountIds=${authorAccountId}`
    }
    
    const data = await jiraClient.tempoFetch(creds, path, { method: 'GET' })
    const logs = data.results || []
    
    if (logs.length === 0) return []

    // v4 only returns issueId, so we need to bridge to issueKey/summary for the UI
    const issueIds = [...new Set(logs.map((l: any) => String(l.issue.id)))]
    if (issueIds.length > 0) {
      try {
        // Jira JQL supports both id and issue as field names for IDs. 
        // Using "id IN (...)" with quoted values for maximum safety.
        const jql = `id IN ("${issueIds.join('","')}")`
        const issues = await jiraService.searchIssues(creds, jql, issueIds.length)
        const issueMap = new Map(issues.map(i => [String(i.id), i]))
        
        return logs.map((log: any) => {
          const logIssueId = String(log.issue.id)
          const jiraIssue = issueMap.get(logIssueId)
          
          if (!jiraIssue) {
            console.warn(`[Jira Service] Could not resolve issue details for ID: ${logIssueId}`)
          }

          return {
            ...log,
            issue: {
              ...log.issue,
              key: jiraIssue?.key || `ID: ${logIssueId}`,
              summary: jiraIssue?.fields?.summary || '',
            }
          }
        })
      } catch (error) {
        console.error('[Jira Service] Bulk resolve failed:', error)
        // Fallback to showing IDs if lookup fails
        return logs.map((log: any) => ({
          ...log,
          issue: { ...log.issue, key: `ID: ${log.issue.id}` }
        }))
      }
    }

    return logs
  },
}
