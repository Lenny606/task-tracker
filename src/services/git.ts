import { createServerFn } from '@tanstack/react-start'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export type GitCommit = {
  hash: string
  authorName: string
  authorEmail: string
  date: string
  message: string
}

export const getServerCommits = createServerFn({
  method: 'GET',
}).handler(async () => {
  try {
    // Format: hash|author_name|author_email|date|message
    const { stdout } = await execAsync('git log -n 50 --pretty=format:"%H|%an|%ae|%aI|%s"')
    
    if (!stdout) return []

    const commits: GitCommit[] = stdout.split('\n').filter(Boolean).map(line => {
      const [hash, authorName, authorEmail, date, ...messageParts] = line.split('|')
      return {
        hash,
        authorName,
        authorEmail,
        date,
        message: messageParts.join('|') // In case the message contains a pipe
      }
    })

    return commits
  } catch (error) {
    console.error('Failed to fetch git commits:', error)
    throw new Error('Failed to fetch git commits')
  }
})
