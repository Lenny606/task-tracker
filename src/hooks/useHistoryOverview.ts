import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getHistoryDataFn, deleteHistoryDayFn } from '../services/tasksServer'
import type { HistoryData } from './useTasks'

/**
 * Read-only history map for overview pages (history list, calendar).
 * Pass a date range to only load the days actually displayed.
 */
export function useHistoryOverview(range?: { from?: string; to?: string }) {
  const queryClient = useQueryClient()

  const { data: history = {} as HistoryData } = useQuery({
    queryKey: ['history-overview', range?.from ?? null, range?.to ?? null],
    queryFn: () => getHistoryDataFn(range ? { data: range } : undefined).then(res => res as HistoryData),
  })

  const deleteHistoryDay = useMutation({
    mutationFn: async (dateToDelete: string) => {
      await deleteHistoryDayFn({ data: { date: dateToDelete } })
      return dateToDelete
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] })
      queryClient.invalidateQueries({ queryKey: ['history-overview'] })
    },
  })

  return { history, deleteHistoryDay }
}
