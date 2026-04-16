/**
 * Jira and Tempo API Service
 */

export interface JiraCredentials {
  url: string
  email: string
  apiKey: string
  tempoApiKey?: string
}

export interface JiraIssue {
  id: string
  key: string
  self: string
  fields: {
    summary: string
    status: {
      name: string
    }
    project: {
      key: string
      name: string
    }
    issuetype: {
      name: string
    }
    updated: string
    [key: string]: any
  }
}

export interface CreateIssueData {
  projectKey: string
  summary: string
  description: string
  issueTypeName: string
}

export interface TempoWorklogData {
  issueKey: string
  timeSpentSeconds: number
  startDate: string
  startTime: string
  description: string
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
    const url = `${creds.url.replace(/\/$/, '')}${path}`
    const auth = btoa(`${creds.email}:${creds.apiKey}`)

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
      const error = await response.text()
      console.error(`[Jira API Error] ${path}:`, error)
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
    const data = await jiraClient.fetch(creds, `/rest/api/3/search`, {
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
   * Log work using Tempo
   */
  logWork: async (creds: JiraCredentials, data: TempoWorklogData): Promise<any> => {
    return await jiraClient.tempoFetch(creds, `/core/3/worklogs`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
