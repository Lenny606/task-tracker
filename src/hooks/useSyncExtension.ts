import { useMutation, type QueryClient } from '@tanstack/react-query'
import { getExtensionTokenFn } from '../services/settingsServer'
import { updateTaskFn, updateDayMetricsFn } from '../services/tasksServer'
import type { Task } from './useTasks'

export function useSyncExtension(
  date: string,
  tasks: Task[],
  queryClient: QueryClient,
  historyKey: any[]
) {
  const syncExtensionData = useMutation({
    mutationFn: async () => {
      const token = await getExtensionTokenFn()
      const response = await fetch('/api/extension', {
        headers: {
          'X-Extension-Auth': token
        }
      })
      if (!response.ok) throw new Error('Failed to fetch extension data')
      const { clips, timerState } = await response.json()
      
      const existingIds = new Set(tasks.map(t => t.id))
      
      const newTasksFromExtension = clips.filter((item: any) => !existingIds.has(item.id)).map((item: any) => ({
        id: item.id,
        name: item.isTimerTask ? item.title : `[Clip] ${item.title}`,
        totalSeconds: item.totalSeconds || 0,
        isRunning: false,
        isMarked: item.isTimerTask || false,
        notes: item.notes,
        url: item.url
      }))

      for (const task of newTasksFromExtension) {
        await updateTaskFn({ data: { date, task } })
      }

      const updatedGlobalTimer = {
        isRunning: timerState.isRunning,
        startTime: timerState.startTime,
        totalSeconds: timerState.accumulatedSeconds || 0
      }
      
      await updateDayMetricsFn({ data: { date, metrics: { globalTimer: updatedGlobalTimer } } })
      
      return { tasks: [...tasks, ...newTasksFromExtension], globalTimer: updatedGlobalTimer }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  return { syncExtensionData }
}
