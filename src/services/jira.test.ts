import { describe, it, expect, vi, beforeEach } from 'vitest'
import { jiraService, jiraClient } from './jira'

describe('jiraService', () => {
  const mockCreds = {
    url: 'https://test.atlassian.net',
    email: 'test@example.com',
    apiKey: 'test-api-key',
    tempoApiKey: 'test-tempo-token',
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('btoa', (str: string) => Buffer.from(str).toString('base64'))
  })

  it('searchIssues should send correct POST request', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ issues: [{ id: '1', key: 'TEST-1' }] }),
    } as Response)

    const result = await jiraService.searchIssues(mockCreds, 'project = TEST')

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/rest/api/3/search'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Basic '),
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining('project = TEST'),
      })
    )
    expect(result[0].key).toBe('TEST-1')
  })

  it('logWork should use Tempo API v4 with numeric issueId', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    const worklogData = {
      issueId: '10001',
      issueKey: 'TEST-1',
      timeSpentSeconds: 3600,
      startDate: '2023-10-27',
      startTime: '10:00:00',
      description: 'Test worklog',
    }

    await jiraService.logWork(mockCreds, worklogData)

    expect(fetch).toHaveBeenCalledWith(
      'https://api.tempo.io/4/worklogs',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-tempo-token',
        }),
        body: expect.stringContaining('"issueId":10001'),
      })
    )
  })

  it('createIssue should format description as ADF', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '123', key: 'TEST-2' }),
    } as Response)

    const issueData = {
      projectKey: 'TEST',
      summary: 'New issue',
      description: 'Hello world',
      issueTypeName: 'Task',
    }

    await jiraService.createIssue(mockCreds, issueData)

    const lastCall = vi.mocked(fetch).mock.calls[0]
    const body = JSON.parse(lastCall[1]?.body as string)
    
    expect(body.fields.description.type).toBe('doc')
    expect(body.fields.description.content[0].content[0].text).toBe('Hello world')
  })

  it('getWorklogs should use v4 endpoint and resolve issue details', async () => {
    // 1. Mock Tempo response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        results: [{ 
          tempoWorklogId: '123',
          issue: { id: 10001 },
          timeSpentSeconds: 3600,
          startDate: '2023-10-01',
          startTime: '10:00:00'
        }] 
      }),
    } as Response)

    // 2. Mock Jira lookup response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        issues: [{ 
          id: '10001', 
          key: 'TEST-1',
          fields: { summary: 'Test Issue' }
        }] 
      }),
    } as Response)

    const result = await jiraService.getWorklogs(mockCreds, '2023-10-01', '2023-10-31', 'acc-123')

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/4/worklogs?from=2023-10-01&to=2023-10-31&authorAccountIds=acc-123'),
      expect.objectContaining({ method: 'GET' })
    )
    
    expect(result[0].issue.key).toBe('TEST-1')
    expect(result[0].issue.summary).toBe('Test Issue')
  })
})
