import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@tanstack/react-start', () => {
  const fn: any = {
    validator: () => fn,
    handler: (handlerFn: any) => handlerFn,
  }
  return {
    __esModule: true,
    createServerFn: () => fn,
  }
})

import { SummaryPage } from '../summary'

// Hoist mocks to avoid initialization ReferenceErrors in Vitest
const {
  mockNavigate,
  mockUseSearch,
  mockGetServerCommits,
  mockAnalyzeCommitsForJira
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseSearch: vi.fn().mockReturnValue({ date: '2026-06-02' }),
  mockGetServerCommits: vi.fn(),
  mockAnalyzeCommitsForJira: vi.fn()
}))

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: (path: string) => {
    return () => ({
      useSearch: mockUseSearch,
    })
  },
  useNavigate: () => mockNavigate,
}))

// Mock settings store
vi.mock('../../store/settingsStore', () => ({
  useSettings: () => ({
    settings: { jiraUrl: 'https://test-jira.com' }
  }),
  getJiraCredentials: () => ({
    username: 'test-user',
    token: 'test-token'
  })
}))

vi.mock('../../services/git', () => ({
  getServerCommits: (...args: any[]) => mockGetServerCommits(...args)
}))

vi.mock('../../services/ai', () => ({
  aiService: {
    analyzeCommitsForJira: (...args: any[]) => mockAnalyzeCommitsForJira(...args)
  }
}))

// Mock JiraIssueSelector and ProjectSelector
vi.mock('../../components/JiraIssueSelector', () => ({
  JiraIssueSelector: ({ onSelect, currentSelection }: any) => (
    <div data-testid="jira-selector">
      <span>Jira: {currentSelection || 'None'}</span>
      <button onClick={() => onSelect({ key: 'TEST-123', fields: { summary: 'Mock Summary' } })}>
        Select Jira
      </button>
    </div>
  )
}))

vi.mock('../../components/ProjectSelector', () => ({
  ProjectSelector: ({ selectedProjectId, onSelect }: any) => (
    <div data-testid="project-selector">
      <span>Project: {selectedProjectId || 'None'}</span>
      <button onClick={() => onSelect('proj-123')}>
        Select Project
      </button>
    </div>
  )
}))

// Mock useTasks hook
const mockUseTasks = vi.fn()
vi.mock('../../hooks/useTasks', () => ({
  useTasks: (date: string) => mockUseTasks(date)
}))

describe('SummaryPage Component', () => {
  let mockTasksState: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSearch.mockReturnValue({ date: '2026-06-02' })

    mockTasksState = {
      tasks: [
        {
          id: 'task-1',
          name: 'Implement OAuth authentication',
          totalSeconds: 3600, // 1 hour
          isRunning: false,
          isMarked: false,
          jiraKey: 'JIRA-101',
          jiraSummary: 'Implement login screen OAuth',
          trackerProjectId: 'proj-1'
        },
        {
          id: 'task-2',
          name: 'Fix memory leak in parser',
          totalSeconds: 7200, // 2 hours
          isRunning: false,
          isMarked: true,
          jiraKey: null,
          jiraSummary: null,
          trackerProjectId: null
        }
      ],
      getDisplayTime: (t: any) => t.totalSeconds,
      globalTimer: { totalSeconds: 10800, isRunning: false },
      getDisplayGlobalTime: (t: any) => t.totalSeconds,
      aiSummary: 'Mock AI Commits Summary output.',
      saveAiSummary: { mutate: vi.fn() },
      toggleMarked: { mutate: vi.fn() },
      updateTask: { mutate: vi.fn() },
      addTask: { mutate: vi.fn() },
      deleteTask: { mutate: vi.fn() },
      newTaskName: '',
      setNewTaskName: vi.fn(),
      pendingJiraTicket: null,
      setPendingJiraTicket: vi.fn()
    }

    mockUseTasks.mockReturnValue(mockTasksState)
  })

  it('renders stats, headers, and task rows correctly', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'))

    render(<SummaryPage />)

    // Check header and date
    expect(screen.getByText('Summary: 2026-06-02')).toBeInTheDocument()

    // Check stats (3 hours tasks, 3 hours global, 2 tasks)
    expect(screen.getByText('3h 0m')).toBeInTheDocument() // tasks sum: 3600 + 7200 = 10800
    expect(screen.getAllByText('03:00:00')[0]).toBeInTheDocument() // global time formatted: 10800 seconds

    // Check tasks listed
    expect(screen.getByDisplayValue('Implement OAuth authentication')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Fix memory leak in parser')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('renders "No data available" when task list is empty', () => {
    mockTasksState.tasks = []
    render(<SummaryPage />)
    expect(screen.getByText(/No data available for/)).toBeInTheDocument()
  })

  it('handles date navigation - previous and next day clicks', () => {
    render(<SummaryPage />)

    // Previous day navigation
    const prevBtn = screen.getByTitle('Previous Day')
    fireEvent.click(prevBtn)
    expect(mockNavigate).toHaveBeenCalledWith({
      search: expect.any(Function)
    })

    // Invoke the search updater function to verify target date calculation
    const searchUpdater = mockNavigate.mock.calls[0][0].search
    const nextSearch = searchUpdater({ date: '2026-06-02' })
    expect(nextSearch.date).toBe('2026-06-01')
  })

  it('handles JIRA and Project selections inside the task row', () => {
    render(<SummaryPage />)

    // Click select JIRA on task row
    const jiraSelectButtons = screen.getAllByText('Select Jira')
    fireEvent.click(jiraSelectButtons[0])
    expect(mockTasksState.updateTask.mutate).toHaveBeenCalledWith({
      taskId: 'task-1',
      jiraKey: 'TEST-123',
      jiraSummary: 'Mock Summary'
    })

    // Click select Project on task row
    const projectSelectButtons = screen.getAllByText('Select Project')
    fireEvent.click(projectSelectButtons[0])
    expect(mockTasksState.updateTask.mutate).toHaveBeenCalledWith({
      taskId: 'task-1',
      trackerProjectId: 'proj-123'
    })
  })

  it('handles task deletion', () => {
    render(<SummaryPage />)

    const deleteButtons = screen.getAllByTitle('Delete task')
    fireEvent.click(deleteButtons[0])
    expect(mockTasksState.deleteTask.mutate).toHaveBeenCalledWith('task-1')
  })

  it('handles task toggleMarked action', () => {
    render(<SummaryPage />)

    // Clicking checkbox/circle button to toggle marked state
    const toggleButtons = screen.getAllByRole('button', { name: '' }).filter(
      btn => btn.querySelector('svg')
    )
    // The first one is the checkbox toggle button
    fireEvent.click(toggleButtons[0])
    expect(mockTasksState.toggleMarked.mutate).toHaveBeenCalledWith('task-1')
  })

  it('handles Log to Jira action and navigates to JIRA route', () => {
    render(<SummaryPage />)

    const logJiraButtons = screen.getAllByTitle('Log to Jira')
    fireEvent.click(logJiraButtons[0])

    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/jira',
      search: {
        view: 'create',
        description: 'Implement OAuth authentication',
        duration: '1h',
        issueKey: 'JIRA-101',
        issueSummary: 'Implement login screen OAuth',
        date: '2026-06-02'
      }
    })
  })

  it('handles AI JIRA Summary generation flow', async () => {
    mockTasksState.aiSummary = null
    mockGetServerCommits.mockResolvedValue(['Commit 1 message', 'Commit 2 message'])
    mockAnalyzeCommitsForJira.mockResolvedValue('Synthesized commit summary in JIRA style.')

    render(<SummaryPage />)

    const generateBtn = screen.getByText('Generate JIRA Summary')
    fireEvent.click(generateBtn)

    await waitFor(() => {
      expect(mockGetServerCommits).toHaveBeenCalledWith({ data: { targetDate: '2026-06-02' } })
      expect(mockAnalyzeCommitsForJira).toHaveBeenCalledWith(['Commit 1 message', 'Commit 2 message'])
      expect(mockTasksState.saveAiSummary.mutate).toHaveBeenCalledWith('Synthesized commit summary in JIRA style.')
    })
  })
})
