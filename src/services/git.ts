import { createServerFn } from '@tanstack/react-start'
import { collectCommits } from './gitCore'


export const getServerCommits = createServerFn({
  method: 'GET',
})
  .handler(async ({ data }: { data?: { targetDate?: string } }) => {
    return await collectCommits(data?.targetDate)
  })
