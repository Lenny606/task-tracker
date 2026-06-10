import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { analyzeCommitsForJira } from './aiCore'
import { collectCommits } from './gitCore'

// This file is imported by client code, so it must only export server
// functions — server-only AI logic lives in aiCore.ts.

/**
 * Server function: collect the day's commits and produce a JIRA-style summary.
 */
export const analyzeCommitsForJiraFn = createServerFn({
  method: 'POST',
})
  .inputValidator((data: unknown) => z.object({
    targetDate: z.string().optional(),
  }).parse(data))
  .handler(async ({ data }) => {
    try {
      const commits = await collectCommits(data.targetDate)
      return await analyzeCommitsForJira(commits)
    } catch (error) {
      console.error('[Server Function Error] analyzeCommitsForJiraFn:', error);
      throw error;
    }
  })
