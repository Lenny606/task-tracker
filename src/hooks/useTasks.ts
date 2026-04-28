import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { 
  getHistoryDataFn, 
  updateTaskFn, 
  deleteTaskFn, 
  updateDayMetricsFn, 
  deleteHistoryDayFn 
} from '../services/tasksServer'

export interface Task {
  id: string
  name: string
  jiraKey?: string | null
  jiraSummary?: string | null
  totalSeconds: number
  isRunning: boolean
  isMarked?: boolean
  startTime?: number
}

export interface GlobalTimer {
  totalSeconds: number
  isRunning: boolean
  startTime?: number
}

export interface DayData {
  tasks: Task[]
  globalTimer?: GlobalTimer
  aiSummary?: string
}

interface HistoryData {
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

  const { data: history = {} as HistoryData } = useQuery({
    queryKey: ['history'],
    queryFn: () => getHistoryDataFn().then(res => res as HistoryData),
  })

  const dayData = history[date] || { tasks: [] }
  const tasks = dayData.tasks || []
  const globalTimer = dayData.globalTimer || { totalSeconds: 0, isRunning: false }
  const aiSummary = dayData.aiSummary

  const addTask = useMutation({
    mutationFn: async ({ name, totalSeconds = 0 }: { name: string; totalSeconds?: number }) => {
      const now = Date.now()
      // Stop other running tasks first
      for (const task of tasks) {
        if (task.isRunning) {
          const elapsed = Math.floor((now - (task.startTime || now)) / 1000)
          const stoppedTask = { 
            ...task, 
            isRunning: false, 
            totalSeconds: task.totalSeconds + elapsed, 
            startTime: undefined 
          }
          await updateTaskFn({ data: { date, task: stoppedTask } })
        }
      }

      const id = crypto.randomUUID()
      const task = { 
        id, 
        name, 
        totalSeconds, 
        isRunning: true, 
        isMarked: false,
        jiraKey: pendingJiraTicket?.key,
        jiraSummary: pendingJiraTicket?.summary,
        startTime: now
      }
      await updateTaskFn({ data: { date, task } })
      return task
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history'] })
      setNewTaskName('')
      setPendingJiraTicket(null)
    },
  })

  const toggleTask = useMutation({
    mutationFn: async (taskId: string) => {
      const t = tasks.find(task => task.id === taskId)
      if (!t) return

      let updatedTask: Task
      if (t.isRunning) {
        const elapsed = Math.floor((Date.now() - (t.startTime || Date.now())) / 1000)
        updatedTask = { ...t, isRunning: false, totalSeconds: t.totalSeconds + elapsed, startTime: undefined }
      } else {
        updatedTask = { ...t, isRunning: true, startTime: Date.now() }
      }

      await updateTaskFn({ data: { date, task: updatedTask } })
      return updatedTask
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  const resetTask = useMutation({
    mutationFn: async (taskId: string) => {
      const t = tasks.find(task => task.id === taskId)
      if (!t) return

      const updatedTask = { ...t, totalSeconds: 0, isRunning: false, startTime: undefined }
      await updateTaskFn({ data: { date, task: updatedTask } })
      return updatedTask
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      await deleteTaskFn({ data: { taskId } })
      return taskId
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  const updateTask = useMutation({
    mutationFn: async ({ taskId, name, totalSeconds, jiraKey, jiraSummary }: { taskId: string; name?: string; totalSeconds?: number; jiraKey?: string | null; jiraSummary?: string | null }) => {
      const t = tasks.find(task => task.id === taskId)
      if (!t) return

      const updatedTask = { 
        ...t, 
        name: name ?? t.name, 
        totalSeconds: totalSeconds ?? t.totalSeconds,
        jiraKey: jiraKey !== undefined ? jiraKey : t.jiraKey,
        jiraSummary: jiraSummary !== undefined ? jiraSummary : t.jiraSummary
      }
      await updateTaskFn({ data: { date, task: updatedTask } })
      return updatedTask
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  const toggleMarked = useMutation({
    mutationFn: async (taskId: string) => {
      const t = tasks.find(task => task.id === taskId)
      if (!t) return

      const updatedTask = { ...t, isMarked: !t.isMarked }
      await updateTaskFn({ data: { date, task: updatedTask } })
      return updatedTask
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  const toggleGlobalTimer = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/extension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'TOGGLE_TIMER', taskName: 'Global Task' }),
      })
      
      if (!response.ok) throw new Error('Failed to sync timer with server')
      const { timerState: serverState } = await response.json()

      const newTimer: GlobalTimer = {
        isRunning: serverState.isRunning,
        startTime: serverState.startTime,
        totalSeconds: serverState.accumulatedSeconds || 0
      }
      
      await updateDayMetricsFn({ data: { date, metrics: { globalTimer: newTimer } } })
      return newTimer
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  const resetGlobalTimer = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/extension', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'CLEAR_TIMER' }),
      })
      
      if (!response.ok) throw new Error('Failed to reset timer on server')
      const { timerState: serverState } = await response.json()

      const newTimer: GlobalTimer = {
        isRunning: serverState.isRunning,
        startTime: serverState.startTime,
        totalSeconds: serverState.accumulatedSeconds || 0
      }
      
      await updateDayMetricsFn({ data: { date, metrics: { globalTimer: newTimer } } })
      return newTimer
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  const saveAiSummary = useMutation({
    mutationFn: async (summary: string) => {
      await updateDayMetricsFn({ data: { date, metrics: { aiSummary: summary } } })
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
      await deleteHistoryDayFn({ data: { date: dateToDelete } })
      return dateToDelete
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  })

  const syncExtensionData = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/extension')
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

  return {
    tasks,
    globalTimer,
    aiSummary,
    history,
    addTask,
    toggleTask,
    toggleMarked,
    resetTask,
    deleteTask,
    updateTask,
    toggleGlobalTimer,
    resetGlobalTimer,
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

