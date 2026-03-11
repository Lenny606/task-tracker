import { describe, it, expect, vi, beforeEach } from 'vitest'
import { aiService } from './ai'
import { GitCommit } from './git'
import { chat } from '@tanstack/ai'

// Mock the tanstack ai functions
vi.mock('@tanstack/ai', () => ({
  chat: vi.fn(),
}))

vi.mock('@tanstack/ai-openai', () => ({
  createOpenaiChat: vi.fn(() => ({})),
}))

describe('AI Analysis Service', () => {
  const mockCommits: GitCommit[] = [
    {
      hash: '1234567',
      authorName: 'Tomas Kravcik',
      authorEmail: 'tomas@example.com',
      date: '2024-03-11T10:00:00Z',
      message: 'feat: add task tracking service',
      projectName: 'task-tracker'
    },
    {
      hash: '7654321',
      authorName: 'John Doe',
      authorEmail: 'john@example.com',
      date: '2024-03-11T11:00:00Z',
      message: 'fix: typo in readme',
      projectName: 'task-tracker'
    },
    {
      hash: 'abcdefg',
      authorName: 'Tomas Kravcik',
      authorEmail: 'tomas@example.com',
      date: '2024-03-11T12:00:00Z',
      message: 'docs: update implementation plan',
      projectName: 'task-tracker'
    }
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key')
    // Default mock implementation
    vi.mocked(chat).mockResolvedValue('Mocked JIRA description' as any)
  })

  it('should filter commits only for Tomas Kravcik', async () => {
    await aiService.analyzeCommitsForJira(mockCommits)
    
    const calledPrompt = vi.mocked(chat).mock.calls[0][0].messages[0].content
    
    expect(calledPrompt).toContain('feat: add task tracking service')
    expect(calledPrompt).toContain('docs: update implementation plan')
    expect(calledPrompt).not.toContain('fix: typo in readme')
    expect(calledPrompt).toContain('Tomas Kravcik')
  })

  it('should return a message if no commits are found for Tomas Kravcik', async () => {
    const otherCommits = [mockCommits[1]]
    const result = await aiService.analyzeCommitsForJira(otherCommits)
    
    expect(result).toBe('No commits found for Tomas Kravcik in the provided data.')
    expect(chat).not.toHaveBeenCalled()
  })

  it('should construct a prompt with the expected structure', async () => {
    await aiService.analyzeCommitsForJira(mockCommits)
    
    const calledPrompt = vi.mocked(chat).mock.calls[0][0].messages[0].content
    
    expect(calledPrompt).toContain('Main Objectives')
    expect(calledPrompt).toContain('Implementation Details')
    expect(calledPrompt).toContain('Git Commits:')
  })
})
