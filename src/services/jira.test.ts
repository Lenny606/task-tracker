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

  it('logWork should use Tempo API with Bearer token', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    const worklogData = {
      issueKey: 'TEST-1',
      timeSpentSeconds: 3600,
      startDate: '2023-10-27',
      startTime: '10:00:00',
      description: 'Test worklog',
    }

    await jiraService.logWork(mockCreds, worklogData)

    expect(fetch).toHaveBeenCalledWith(
      'https://api.tempo.io/core/3/worklogs',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-tempo-token',
        }),
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
})
