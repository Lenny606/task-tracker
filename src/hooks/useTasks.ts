import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

export interface Task {
  id: string
  name: string
  totalSeconds: number
  isRunning: boolean
  startTime?: number // timestamp when the timer was last started
}

const STORAGE_KEY = 'task-tracker-tasks'

const getTasks = (): Task[] => {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? JSON.parse(stored) : []
}

const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export function useTasks() {
  const queryClient = useQueryClient()

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: getTasks,
  })

  // Auxiliary state for real-time display of running timers
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
      saveTasks(newTasks)
      return newTasks
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const toggleTask = useMutation({
    mutationFn: async (taskId: string) => {
      const newTasks = tasks.map((t) => {
        if (t.id === taskId) {
          if (t.isRunning) {
            // Stopping: calculate elapsed and add to total
            const elapsed = Math.floor((Date.now() - (t.startTime || Date.now())) / 1000)
            return { ...t, isRunning: false, totalSeconds: t.totalSeconds + elapsed, startTime: undefined }
          } else {
            // Starting: set start time
            return { ...t, isRunning: true, startTime: Date.now() }
          }
        }
        return t
      })
      saveTasks(newTasks)
      return newTasks
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const resetTask = useMutation({
    mutationFn: async (taskId: string) => {
      const newTasks = tasks.map((t) => {
        if (t.id === taskId) {
          return { ...t, totalSeconds: 0, isRunning: false, startTime: undefined }
        }
        return t
      })
      saveTasks(newTasks)
      return newTasks
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      const newTasks = tasks.filter((t) => t.id !== taskId)
      saveTasks(newTasks)
      return newTasks
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })

  // Helper to get actual display time for a task
  const getDisplayTime = (task: Task) => {
    if (!task.isRunning || !task.startTime) return task.totalSeconds
    const extra = Math.floor((now - task.startTime) / 1000)
    return task.totalSeconds + extra
  }

  return {
    tasks,
    addTask,
    toggleTask,
    resetTask,
    deleteTask,
    getDisplayTime,
  }
}
