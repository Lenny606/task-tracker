// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

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

import { getServerCommits } from './git'
import * as cp from 'child_process'

// Mock child_process and util to avoid running real command
vi.mock('child_process', () => {
  const mockExec = vi.fn()
  return {
    __esModule: true,
    exec: mockExec,
    default: {
      exec: mockExec
    }
  }
})

vi.mock('util', () => {
  const mockPromisify = vi.fn((fn) => fn)
  return {
    __esModule: true,
    promisify: mockPromisify,
    default: {
      promisify: mockPromisify
    }
  }
})

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
    vi.mocked(cp.exec).mockImplementation((cmd, callback: any) => {
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

    expect(cp.exec).toHaveBeenCalled()
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
    vi.mocked(cp.exec).mockResolvedValue({ stdout: '', stderr: '' } as any)

    const result = await getServerCommits({ data: {} })

    expect(cp.exec).toHaveBeenCalled()
    expect(result).toHaveLength(0)
  })
})

