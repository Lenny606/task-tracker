import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerCommits } from '../git'
import { exec } from 'child_process'

// Mock child_process and util to avoid running real command
vi.mock('child_process', () => ({
  exec: vi.fn(),
}))

vi.mock('util', () => ({
  promisify: vi.fn((fn) => fn),
}))

// Mock path module exactly as it behaves in node
vi.mock('path', async () => {
  const actual = await vi.importActual('path')
  return {
    ...actual,
    basename: (p: string) => p.split('/').pop(),
    dirname: (p: string) => p.substring(0, p.lastIndexOf('/'))
  }
})

describe('git service', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should parse git commits correctly across multiple projects', async () => {
    const mockFindStdout = `/home/tomas/projectA/.git\n/home/tomas/projectB/.git`
    
    // Setup execAsync mock to return different things based on the command
    vi.mocked(exec).mockImplementation((cmd, callback: any) => {
      if (typeof cmd === 'string' && cmd.includes('find /home/tomas')) {
        return Promise.resolve({ stdout: mockFindStdout, stderr: '' }) as any
      } else if (typeof cmd === 'string' && cmd.includes('projectA')) {
        return Promise.resolve({
           stdout: `hash1|Alice|alice@test.com|2023-10-27T10:00:00Z|fix: Project A commit`,
           stderr: ''
        }) as any
      } else if (typeof cmd === 'string' && cmd.includes('projectB')) {
        return Promise.resolve({
           stdout: `hash2|Bob|bob@test.com|2023-10-27T09:00:00Z|feat: Project B commit`,
           stderr: ''
        }) as any
      }
      return Promise.resolve({ stdout: '', stderr: '' }) as any
    })

    const result = await getServerCommits({ data: { targetDate: '2023-10-27' } })

    expect(exec).toHaveBeenCalled()
    expect(result).toHaveLength(2)
    
    // Should be sorted descending by default
    expect(result[0]).toEqual({
      hash: 'hash1',
      authorName: 'Alice',
      authorEmail: 'alice@test.com',
      date: '2023-10-27T10:00:00Z',
      message: 'fix: Project A commit',
      projectName: 'projectA'
    })

    expect(result[1]).toEqual({
      hash: 'hash2',
      authorName: 'Bob',
      authorEmail: 'bob@test.com',
      date: '2023-10-27T09:00:00Z',
      message: 'feat: Project B commit',
      projectName: 'projectB'
    })
  })

  it('should return empty array if no git projects found', async () => {
    vi.mocked(exec).mockResolvedValue({ stdout: '', stderr: '' } as any)

    const result = await getServerCommits({ data: {} })

    expect(exec).toHaveBeenCalled()
    expect(result).toHaveLength(0)
  })
})

