import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

export interface Task {
  id: string
  name: string
  totalSeconds: number
  isRunning: boolean
  startTime?: number
}

const STORAGE_KEY = 'task-tracker-history'
const OLD_STORAGE_KEY = 'task-tracker-tasks'

const getTodayDate = () => new Date().toISOString().split('T')[0]

interface HistoryData {
  [date: string]: Task[]
}

const getHistoryData = (): HistoryData => {
  if (typeof window === 'undefined') return {}
  const stored = localStorage.getItem(STORAGE_KEY)
  
  if (!stored) {
    // Migration logic
    const oldData = localStorage.getItem(OLD_STORAGE_KEY)
    if (oldData) {
      const tasks = JSON.parse(oldData)
      const migrated = { [getTodayDate()]: tasks }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return migrated
    }
    return {}
  }
  
  return JSON.parse(stored)
}

const saveTasksForDate = (date: string, tasks: Task[]) => {
  const history = getHistoryData()
  history[date] = tasks
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
}

export function useTasks(date: string = getTodayDate()) {
  const queryClient = useQueryClient()

  const { data: history = {} } = useQuery({
    queryKey: ['history'],
    queryFn: getHistoryData,
  })

  const tasks = history[date] || []

  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

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

  const getDisplayTime = (task: Task) => {
    if (!task.isRunning || !task.startTime) return task.totalSeconds
    const extra = Math.floor((now - task.startTime) / 1000)
    return task.totalSeconds + extra
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
    history,
    addTask,
    toggleTask,
    resetTask,
    deleteTask,
    deleteHistoryDay,
    getDisplayTime,
  }
}

