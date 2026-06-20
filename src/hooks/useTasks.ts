import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { 
  getHistoryDataFn, 
  updateDayMetricsFn, 
  deleteHistoryDayFn 
} from '../services/tasksServer'
import { useGlobalTimer, type GlobalTimer } from './useGlobalTimer'
import { useSyncExtension } from './useSyncExtension'
import { useTaskMutations } from './useTaskMutations'

export interface Task {
  id: string
  name: string
  jiraKey?: string | null
  jiraSummary?: string | null
  trackerProjectId?: string | null
  totalSeconds: number
  isRunning: boolean
  isMarked?: boolean
  startTime?: number
}

export type { GlobalTimer }

export interface DayData {
  tasks: Task[]
  globalTimer?: GlobalTimer
  aiSummary?: string
}

export interface HistoryData {
  [date: string]: DayData
}

const getTodayDate = () => new Date().toISOString().split('T')[0]

export function useTasks(date: string = getTodayDate()) {
  const [now, setNow] = useState(Date.now())
  const [isSyncingExtension, setIsSyncingExtension] = useState(false)
  const [newTaskName, setNewTaskName] = useState('')
  const [pendingJiraTicket, setPendingJiraTicket] = useState<{ key: string, summary: string } | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const queryClient = useQueryClient()
  const historyKey = ['history', date]

  // Main Query
  const { data: history = {} as HistoryData } = useQuery({
    queryKey: historyKey,
    queryFn: () => getHistoryDataFn({ data: { from: date, to: date } }).then(res => res as HistoryData),
  })

  const dayData = history[date] || { tasks: [] }
  const tasks = dayData.tasks || []
  const globalTimer = dayData.globalTimer || { totalSeconds: 0, isRunning: false }
  const aiSummary = dayData.aiSummary

  // 1. Delegating Global Timer Hook
  const { toggleGlobalTimer, resetGlobalTimer, updateGlobalTimer } = useGlobalTimer(
    date,
    globalTimer,
    queryClient,
    historyKey
  )

  // 2. Delegating Task Mutations Hook
  const { addTask, toggleTask, resetTask, deleteTask, updateTask, toggleMarked } = useTaskMutations(
    date,
    tasks,
    queryClient,
    historyKey,
    pendingJiraTicket,
    setNewTaskName,
    setPendingJiraTicket
  )

  // 3. Delegating Sync Extension Hook
  const { syncExtensionData } = useSyncExtension(
    date,
    tasks,
    queryClient,
    historyKey
  )

  // AI Summary Mutation
  const saveAiSummary = useMutation({
    mutationFn: async (summary: string) => {
      await updateDayMetricsFn({ data: { date, metrics: { aiSummary: summary } } })
      return summary
    },
    onMutate: async (summary) => {
      await queryClient.cancelQueries({ queryKey: historyKey })
      const previousHistory = queryClient.getQueryData(historyKey)

      queryClient.setQueryData(historyKey, (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        return {
          ...currentHistory,
          [date]: {
            ...day,
            aiSummary: summary
          }
        }
      })

      return { previousHistory }
    },
    onError: (err, variables, context) => {
      if (context?.previousHistory) {
        queryClient.setQueryData(historyKey, context.previousHistory)
      }
    },
    onSuccess: (data) => {
      if (!data) return
      queryClient.setQueryData(historyKey, (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        return {
          ...currentHistory,
          [date]: {
            ...day,
            aiSummary: data
          }
        }
      })
    }
  })

  // Delete History Day
  const deleteHistoryDay = useMutation({
    mutationFn: async (dateToDelete: string) => {
      await deleteHistoryDayFn({ data: { date: dateToDelete } })
      return dateToDelete
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  // Time Helpers
  const getDisplayTime = (task: Task) => {
    if (!task.isRunning || !task.startTime) return task.totalSeconds
    const extra = Math.floor((now - task.startTime) / 1000)
    return task.totalSeconds + extra
  }

  const getDisplayGlobalTime = (timer: GlobalTimer) => {
    if (!timer.isRunning || !timer.startTime) return timer.totalSeconds
    const extra = Math.floor((now - timer.startTime) / 1000)
    return timer.totalSeconds + extra
  }

  return {
    tasks,
    globalTimer,
    aiSummary,
    addTask,
    toggleTask,
    toggleMarked,
    resetTask,
    deleteTask,
    updateTask,
    toggleGlobalTimer,
    resetGlobalTimer,
    updateGlobalTimer,
    saveAiSummary,
    deleteHistoryDay,
    syncExtensionData,
    isSyncingExtension,
    newTaskName,
    setNewTaskName,
    pendingJiraTicket,
    setPendingJiraTicket,
    syncExtension: async () => {
      setIsSyncingExtension(true)
      try {
        await syncExtensionData.mutateAsync()
      } finally {
        setIsSyncingExtension(false)
      }
    },
    getDisplayTime,
    getDisplayGlobalTime,
  }
}
