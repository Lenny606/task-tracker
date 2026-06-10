import { createServerFn } from '@tanstack/react-start'
import { collectCommits } from './gitCore'

// This file is imported by client code, so it must only export server
// functions (and types) — server-only logic lives in gitCore.ts.
export type { GitCommit } from './gitCore'

export const getServerCommits = createServerFn({
  method: 'GET',
})
  .handler(async ({ data }: { data?: { targetDate?: string } }) => {
    return await collectCommits(data?.targetDate)
  })
