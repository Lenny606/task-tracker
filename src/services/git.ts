import { createServerFn } from '@tanstack/react-start'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as path from 'path'

const execAsync = promisify(exec)

export type GitCommit = {
  hash: string
  authorName: string
  authorEmail: string
  date: string
  message: string
  projectName: string
}

// Internal function to find generic git projects in the home directory
async function discoverGitProjects(): Promise<string[]> {
  try {
    // Find all directories named .git inside /home/tomas, but exclude /home/tomas/my-projects
    const cmd = `find /home/tomas -type d -name "my-projects" -prune -o -type d -name ".git" -print`
    const { stdout } = await execAsync(cmd)
    
    // Convert paths like /home/tomas/projectA/.git to /home/tomas/projectA
    return stdout
      .split('\n')
      .filter(Boolean)
      .map((gitPath) => path.dirname(gitPath))
  } catch (error) {
    console.error('Failed to discover git projects:', error)
    return []
  }
}

export const getServerCommits = createServerFn({
  method: 'GET',
})
  .validator((d: { targetDate?: string }) => d)
  .handler(async ({ data }) => {
    try {
      const projects = await discoverGitProjects()
      
      if (projects.length === 0) return []

      // If no date provided, default to today
      const dateToFetch = data.targetDate ? new Date(data.targetDate) : new Date()
      
      // Setup start and end boundaries for the git log command
      const startOfDay = new Date(dateToFetch)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(dateToFetch)
      endOfDay.setHours(23, 59, 59, 999)

      const sinceStr = startOfDay.toISOString()
      const untilStr = endOfDay.toISOString()

      // Format: hash|author_name|author_email|date|message
      const gitCmd = `git log --all --since="${sinceStr}" --until="${untilStr}" --pretty=format:"%H|%an|%ae|%aI|%s"`

      const allCommits: GitCommit[] = []

      // Fetch commits for all projects in parallel
      const fetchPromises = projects.map(async (projectPath) => {
        try {
          const projectName = path.basename(projectPath)
          const { stdout } = await execAsync(`cd ${projectPath} && ${gitCmd}`)
          
          if (!stdout) return
          
          const lines = stdout.split('\n').filter(Boolean)
          
          for (const line of lines) {
             const [hash, authorName, authorEmail, date, ...messageParts] = line.split('|')
             allCommits.push({
               hash,
               authorName,
               authorEmail,
               date,
               message: messageParts.join('|'), // In case the message contains a pipe
               projectName
             })
          }
        } catch (err) {
          // Ignore projects that failed to run git log (e.g. permission denied or corrupted git repo)
          console.error(`Skipping ${projectPath} due to error:`, err)
        }
      })

      await Promise.all(fetchPromises)

      // Sort all commits globally by date descending (newest first)
      allCommits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      return allCommits
    } catch (error) {
      console.error('Failed to fetch git commits:', error)
      throw new Error('Failed to fetch git commits')
    }
  })
