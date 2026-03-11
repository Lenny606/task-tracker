import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getServerCommits } from '../git'

// Mock child_process and util to avoid running real git commands in tests
vi.mock('child_process', () => ({
  exec: vi.fn(),
}))

vi.mock('util', () => ({
  promisify: vi.fn((fn) => fn),
}))

import { exec } from 'child_process'

describe('git service', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should parse git commits correctly', async () => {
    const mockStdout = `hash1|Alice|alice@test.com|2023-10-27T10:00:00Z|fix: First commit
hash2|Bob|bob@test.com|2023-10-26T09:00:00Z|feat: Second commit | with pipe
`
    vi.mocked(exec).mockResolvedValue({ stdout: mockStdout, stderr: '' } as any)

    const result = await getServerCommits()

    expect(exec).toHaveBeenCalled()
    expect(result).toHaveLength(2)
    
    expect(result[0]).toEqual({
      hash: 'hash1',
      authorName: 'Alice',
      authorEmail: 'alice@test.com',
      date: '2023-10-27T10:00:00Z',
      message: 'fix: First commit'
    })

    expect(result[1]).toEqual({
      hash: 'hash2',
      authorName: 'Bob',
      authorEmail: 'bob@test.com',
      date: '2023-10-26T09:00:00Z',
      message: 'feat: Second commit | with pipe'
    })
  })

  it('should return empty array if no git commits', async () => {
    vi.mocked(exec).mockResolvedValue({ stdout: '', stderr: '' } as any)

    const result = await getServerCommits()

    expect(exec).toHaveBeenCalled()
    expect(result).toHaveLength(0)
  })

  it('should throw an error if git log fails', async () => {
    vi.mocked(exec).mockRejectedValue(new Error('Git failed') as never)

    await expect(getServerCommits()).rejects.toThrow('Failed to fetch git commits')
  })
})
