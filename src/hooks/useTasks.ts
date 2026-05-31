import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { 
  getHistoryDataFn, 
  updateTaskFn, 
  deleteTaskFn, 
  updateDayMetricsFn, 
  deleteHistoryDayFn 
} from '../services/tasksServer'
import { getExtensionTokenFn } from '../services/settingsServer'


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
    mutationFn: async ({ id, name, totalSeconds = 0 }: { id?: string; name: string; totalSeconds?: number }) => {
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

      const taskId = id || crypto.randomUUID()
      const task = { 
        id: taskId, 
        name, 
        totalSeconds, 
        isRunning: true, 
        isMarked: false,
        jiraKey: pendingJiraTicket?.key,
        jiraSummary: pendingJiraTicket?.summary,
        trackerProjectId: null, // New tasks start with no project by default
        startTime: now
      }
      await updateTaskFn({ data: { date, task } })
      return task
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['history'] })
      const previousHistory = queryClient.getQueryData(['history'])
      const taskId = variables.id || 'temp-' + crypto.randomUUID()
      const nowTime = Date.now()

      queryClient.setQueryData(['history'], (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        const stoppedTasks = (day.tasks || []).map((t: any) => {
          if (t.isRunning) {
            const elapsed = Math.floor((nowTime - (t.startTime || nowTime)) / 1000)
            return {
              ...t,
              isRunning: false,
              totalSeconds: t.totalSeconds + elapsed,
              startTime: undefined
            }
          }
          return t
        })

        const newTask = {
          id: taskId,
          name: variables.name,
          totalSeconds: variables.totalSeconds || 0,
          isRunning: true,
          isMarked: false,
          jiraKey: pendingJiraTicket?.key,
          jiraSummary: pendingJiraTicket?.summary,
          trackerProjectId: null,
          startTime: nowTime
        }

        return {
          ...currentHistory,
          [date]: {
            ...day,
            tasks: [...stoppedTasks, newTask]
          }
        }
      })

      return { previousHistory }
    },
    onError: (err, variables, context) => {
      if (context?.previousHistory) {
        queryClient.setQueryData(['history'], context.previousHistory)
      }
    },
    onSuccess: (data) => {
      if (!data) return
      queryClient.setQueryData(['history'], (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        const newTasks = (day.tasks || []).map((t: any) => {
          if (t.id === data.id || t.id.startsWith('temp-')) {
            return {
              ...t,
              id: data.id,
              name: data.name,
              totalSeconds: data.totalSeconds,
              isRunning: data.isRunning,
              isMarked: data.isMarked,
              jiraKey: data.jiraKey,
              jiraSummary: data.jiraSummary,
              trackerProjectId: data.trackerProjectId,
              startTime: data.startTime ? new Date(data.startTime).getTime() : undefined
            }
          }
          return t
        })
        const exists = newTasks.some((t: any) => t.id === data.id)
        const finalTasks = exists ? newTasks : [...newTasks, {
          ...data,
          startTime: data.startTime ? new Date(data.startTime).getTime() : undefined
        }]
        return {
          ...currentHistory,
          [date]: {
            ...day,
            tasks: finalTasks
          }
        }
      })
    },
    onSettled: () => {
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
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['history'] })
      const previousHistory = queryClient.getQueryData(['history'])

      queryClient.setQueryData(['history'], (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        const newTasks = (day.tasks || []).map((t: any) => {
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
        return {
          ...currentHistory,
          [date]: { ...day, tasks: newTasks }
        }
      })

      return { previousHistory }
    },
    onError: (err, taskId, context) => {
      if (context?.previousHistory) {
        queryClient.setQueryData(['history'], context.previousHistory)
      }
    },
    onSuccess: (data) => {
      if (!data) return
      queryClient.setQueryData(['history'], (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        const newTasks = (day.tasks || []).map((t: any) => {
          if (t.id === data.id) {
            return {
              ...t,
              isRunning: data.isRunning,
              totalSeconds: data.totalSeconds,
              startTime: data.startTime ? new Date(data.startTime).getTime() : undefined
            }
          }
          return t
        })
        return {
          ...currentHistory,
          [date]: { ...day, tasks: newTasks }
        }
      })
    }
  })

  const resetTask = useMutation({
    mutationFn: async (taskId: string) => {
      const t = tasks.find(task => task.id === taskId)
      if (!t) return

      const updatedTask = { ...t, totalSeconds: 0, isRunning: false, startTime: undefined }
      await updateTaskFn({ data: { date, task: updatedTask } })
      return updatedTask
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['history'] })
      const previousHistory = queryClient.getQueryData(['history'])

      queryClient.setQueryData(['history'], (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        const newTasks = (day.tasks || []).map((t: any) => 
          t.id === taskId ? { ...t, totalSeconds: 0, isRunning: false, startTime: undefined } : t
        )
        return {
          ...currentHistory,
          [date]: { ...day, tasks: newTasks }
        }
      })

      return { previousHistory }
    },
    onError: (err, taskId, context) => {
      if (context?.previousHistory) {
        queryClient.setQueryData(['history'], context.previousHistory)
      }
    },
    onSuccess: (data) => {
      if (!data) return
      queryClient.setQueryData(['history'], (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        const newTasks = (day.tasks || []).map((t: any) => {
          if (t.id === data.id) {
            return {
              ...t,
              totalSeconds: 0,
              isRunning: false,
              startTime: undefined
            }
          }
          return t
        })
        return {
          ...currentHistory,
          [date]: { ...day, tasks: newTasks }
        }
      })
    }
  })

  const deleteTask = useMutation({
    mutationFn: async (taskId: string) => {
      await deleteTaskFn({ data: { taskId } })
      return taskId
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['history'] })
      const previousHistory = queryClient.getQueryData(['history'])

      queryClient.setQueryData(['history'], (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        const newTasks = (day.tasks || []).filter((t: any) => t.id !== taskId)
        return {
          ...currentHistory,
          [date]: { ...day, tasks: newTasks }
        }
      })

      return { previousHistory }
    },
    onError: (err, taskId, context) => {
      if (context?.previousHistory) {
        queryClient.setQueryData(['history'], context.previousHistory)
      }
    }
  })

  const updateTask = useMutation({
    mutationFn: async ({ taskId, name, totalSeconds, jiraKey, jiraSummary, trackerProjectId }: { taskId: string; name?: string; totalSeconds?: number; jiraKey?: string | null; jiraSummary?: string | null; trackerProjectId?: string | null }) => {
      const t = tasks.find(task => task.id === taskId)
      if (!t) return

      const updatedTask = { 
        ...t, 
        name: name ?? t.name, 
        totalSeconds: totalSeconds ?? t.totalSeconds,
        jiraKey: jiraKey !== undefined ? jiraKey : t.jiraKey,
        jiraSummary: jiraSummary !== undefined ? jiraSummary : t.jiraSummary,
        trackerProjectId: trackerProjectId !== undefined ? trackerProjectId : t.trackerProjectId
      }
      await updateTaskFn({ data: { date, task: updatedTask } })
      return updatedTask
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ['history'] })
      const previousHistory = queryClient.getQueryData(['history'])

      queryClient.setQueryData(['history'], (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        const newTasks = (day.tasks || []).map((t: any) => {
          if (t.id === variables.taskId) {
            return {
              ...t,
              name: variables.name ?? t.name,
              totalSeconds: variables.totalSeconds ?? t.totalSeconds,
              jiraKey: variables.jiraKey !== undefined ? variables.jiraKey : t.jiraKey,
              jiraSummary: variables.jiraSummary !== undefined ? variables.jiraSummary : t.jiraSummary,
              trackerProjectId: variables.trackerProjectId !== undefined ? variables.trackerProjectId : t.trackerProjectId
            }
          }
          return t
        })

        return {
          ...currentHistory,
          [date]: {
            ...day,
            tasks: newTasks
          }
        }
      })

      return { previousHistory }
    },
    onError: (err, variables, context) => {
      if (context?.previousHistory) {
        queryClient.setQueryData(['history'], context.previousHistory)
      }
    },
    onSuccess: (data) => {
      if (!data) return
      queryClient.setQueryData(['history'], (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        const newTasks = (day.tasks || []).map((t: any) => {
          if (t.id === data.id) {
            return {
              ...t,
              ...data,
              startTime: data.startTime ? new Date(data.startTime).getTime() : undefined
            }
          }
          return t
        })
        return {
          ...currentHistory,
          [date]: { ...day, tasks: newTasks }
        }
      })
    }
  })

  const toggleMarked = useMutation({
    mutationFn: async (taskId: string) => {
      const t = tasks.find(task => task.id === taskId)
      if (!t) return

      const updatedTask = { ...t, isMarked: !t.isMarked }
      await updateTaskFn({ data: { date, task: updatedTask } })
      return updatedTask
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['history'] })
      const previousHistory = queryClient.getQueryData(['history'])

      queryClient.setQueryData(['history'], (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        const newTasks = (day.tasks || []).map((t: any) => 
          t.id === taskId ? { ...t, isMarked: !t.isMarked } : t
        )
        return {
          ...currentHistory,
          [date]: { ...day, tasks: newTasks }
        }
      })

      return { previousHistory }
    },
    onError: (err, taskId, context) => {
      if (context?.previousHistory) {
        queryClient.setQueryData(['history'], context.previousHistory)
      }
    },
    onSuccess: (data) => {
      if (!data) return
      queryClient.setQueryData(['history'], (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        const newTasks = (day.tasks || []).map((t: any) => {
          if (t.id === data.id) {
            return {
              ...t,
              isMarked: data.isMarked
            }
          }
          return t
        })
        return {
          ...currentHistory,
          [date]: { ...day, tasks: newTasks }
        }
      })
    }
  })

  const toggleGlobalTimer = useMutation({
    mutationFn: async () => {
      const token = await getExtensionTokenFn()
      const base = typeof window !== 'undefined' && window.location.origin && !window.location.origin.startsWith('null')
        ? window.location.origin
        : 'http://localhost:3000'
      const response = await fetch(`${base}/api/extension`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Extension-Auth': token
        },
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
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['history'] })
      const previousHistory = queryClient.getQueryData(['history'])

      queryClient.setQueryData(['history'], (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        const timer = day.globalTimer || { totalSeconds: 0, isRunning: false }

        let newTimer: GlobalTimer
        if (timer.isRunning) {
          const elapsed = Math.floor((Date.now() - (timer.startTime || Date.now())) / 1000)
          newTimer = {
            isRunning: false,
            totalSeconds: timer.totalSeconds + elapsed,
            startTime: undefined
          }
        } else {
          newTimer = {
            isRunning: true,
            totalSeconds: timer.totalSeconds,
            startTime: Date.now()
          }
        }

        return {
          ...currentHistory,
          [date]: {
            ...day,
            globalTimer: newTimer
          }
        }
      })

      return { previousHistory }
    },
    onError: (err, variables, context) => {
      if (context?.previousHistory) {
        queryClient.setQueryData(['history'], context.previousHistory)
      }
    },
    onSuccess: (data) => {
      if (!data) return
      queryClient.setQueryData(['history'], (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        return {
          ...currentHistory,
          [date]: {
            ...day,
            globalTimer: data
          }
        }
      })
    }
  })

  const resetGlobalTimer = useMutation({
    mutationFn: async () => {
      const token = await getExtensionTokenFn()
      const response = await fetch('/api/extension', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Extension-Auth': token
        },
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
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['history'] })
      const previousHistory = queryClient.getQueryData(['history'])

      queryClient.setQueryData(['history'], (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        return {
          ...currentHistory,
          [date]: {
            ...day,
            globalTimer: {
              isRunning: false,
              totalSeconds: 0,
              startTime: undefined
            }
          }
        }
      })

      return { previousHistory }
    },
    onError: (err, variables, context) => {
      if (context?.previousHistory) {
        queryClient.setQueryData(['history'], context.previousHistory)
      }
    },
    onSuccess: (data) => {
      if (!data) return
      queryClient.setQueryData(['history'], (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        return {
          ...currentHistory,
          [date]: {
            ...day,
            globalTimer: data
          }
        }
      })
    }
  })

  const saveAiSummary = useMutation({
    mutationFn: async (summary: string) => {
      await updateDayMetricsFn({ data: { date, metrics: { aiSummary: summary } } })
      return summary
    },
    onMutate: async (summary) => {
      await queryClient.cancelQueries({ queryKey: ['history'] })
      const previousHistory = queryClient.getQueryData(['history'])

      queryClient.setQueryData(['history'], (old: any) => {
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
        queryClient.setQueryData(['history'], context.previousHistory)
      }
    },
    onSuccess: (data) => {
      if (!data) return
      queryClient.setQueryData(['history'], (old: any) => {
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

