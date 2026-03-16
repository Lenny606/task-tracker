import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

export interface Task {
  id: string
  name: string
  totalSeconds: number
  isRunning: boolean
  startTime?: number
}

export interface GlobalTimer {
  totalSeconds: number
  isRunning: boolean
  startTime?: number
}

const STORAGE_KEY = 'task-tracker-history'
const OLD_STORAGE_KEY = 'task-tracker-tasks'

const getTodayDate = () => new Date().toISOString().split('T')[0]

export interface DayData {
  tasks: Task[]
  globalTimer?: GlobalTimer
  aiSummary?: string
}

interface HistoryData {
  [date: string]: DayData
}

const getHistoryData = (): HistoryData => {
  if (typeof window === 'undefined') return {}
  const stored = localStorage.getItem(STORAGE_KEY)
  
  if (!stored) {
    // Migration logic
    const oldData = localStorage.getItem(OLD_STORAGE_KEY)
    if (oldData) {
      const tasks = JSON.parse(oldData)
      const migrated = { [getTodayDate()]: { tasks } }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return migrated
    }
    return {}
  }
  
  const data = JSON.parse(stored)
  
  // Migrate from Task[] to DayData if needed
  let hasMigrated = false
  const migratedData: HistoryData = {}
  
  Object.entries(data).forEach(([date, value]) => {
    if (Array.isArray(value)) {
      migratedData[date] = { tasks: value }
      hasMigrated = true
    } else {
      migratedData[date] = value as DayData
    }
  })

  if (hasMigrated) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migratedData))
  }
  
  return migratedData
}

const saveTasksForDate = (date: string, tasks: Task[]) => {
  const history = getHistoryData()
  const dayData = history[date] || { tasks: [] }
  history[date] = { ...dayData, tasks }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

const saveGlobalTimerForDate = (date: string, globalTimer: GlobalTimer) => {
  const history = getHistoryData()
  const dayData = history[date] || { tasks: [] }
  history[date] = { ...dayData, globalTimer }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

const saveAiSummaryForDate = (date: string, aiSummary: string) => {
  const history = getHistoryData()
  const dayData = history[date] || { tasks: [] }
  history[date] = { ...dayData, aiSummary }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export function useTasks(date: string = getTodayDate()) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const queryClient = useQueryClient()

  const { data: history = {} } = useQuery({
    queryKey: ['history'],
    queryFn: getHistoryData,
  })

  const tasks = history[date]?.tasks || []
  const globalTimer = history[date]?.globalTimer || { totalSeconds: 0, isRunning: false }
  const aiSummary = history[date]?.aiSummary

  const addTask = useMutation({
    mutationFn: async (name: string) => {
      const newTasks = [...tasks, { id: crypto.randomUUID(), name, totalSeconds: 0, isRunning: false }]
      saveTasksForDate(date, newTasks)
      return newTasks
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  const toggleTask = useMutation({
    mutationFn: async (taskId: string) => {
      const newTasks = tasks.map((t) => {
        if (t.id === taskId) {
          if (t.isRunning) {
            const elapsed = Math.floor((Date.now() - (t.startTime || Date.now())) / 1000)
            return { ...t, isRunning: false, totalSeconds: t.totalSeconds + elapsed, startTime: undefined }
          } else {
            return { ...t, isRunning: true, startTime: Date.now() }
          }
        }
        return t
      })
      saveTasksForDate(date, newTasks)
      return newTasks
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  const resetTask = useMutation({
    mutationFn: async (taskId: string) => {
      const newTasks = tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, totalSeconds: 0, isRunning: false, startTime: undefined }
        }
        return t
      })
      saveTasksForDate(date, newTasks)
      return newTasks
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const newTasks = tasks.filter((t) => t.id !== taskId)
      saveTasksForDate(date, newTasks)
      return newTasks
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  const toggleGlobalTimer = useMutation({
    mutationFn: async () => {
      let newTimer: GlobalTimer
      if (globalTimer.isRunning) {
        const elapsed = Math.floor((Date.now() - (globalTimer.startTime || Date.now())) / 1000)
        newTimer = {
          ...globalTimer,
          isRunning: false,
          totalSeconds: globalTimer.totalSeconds + elapsed,
          startTime: undefined,
        }
      } else {
        newTimer = {
          ...globalTimer,
          isRunning: true,
          startTime: Date.now(),
        }
      }
      saveGlobalTimerForDate(date, newTimer)
      return newTimer
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  const saveAiSummary = useMutation({
    mutationFn: async (summary: string) => {
      saveAiSummaryForDate(date, summary)
      return summary
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

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

  const deleteHistoryDay = useMutation({
    mutationFn: async (dateToDelete: string) => {
      const history = getHistoryData()
      delete history[dateToDelete]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
      return history
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  return {
    tasks,
    globalTimer,
    aiSummary,
    history,
    addTask,
    toggleTask,
    resetTask,
    deleteTask,
    toggleGlobalTimer,
    saveAiSummary,
    deleteHistoryDay,
    getDisplayTime,
    getDisplayGlobalTime,
  }
}

