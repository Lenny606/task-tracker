import { useMutation, type QueryClient } from '@tanstack/react-query'
import { updateTaskFn, deleteTaskFn } from '../services/tasksServer'
import type { Task } from './useTasks'

export function useTaskMutations(
  date: string,
  tasks: Task[],
  queryClient: QueryClient,
  historyKey: any[],
  pendingJiraTicket: { key: string, summary: string } | null,
  setNewTaskName: (val: string) => void,
  setPendingJiraTicket: (val: { key: string, summary: string } | null) => void
) {
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
      await queryClient.cancelQueries({ queryKey: historyKey })
      const previousHistory = queryClient.getQueryData(historyKey)
      const taskId = variables.id || 'temp-' + crypto.randomUUID()
      const nowTime = Date.now()

      queryClient.setQueryData(historyKey, (old: any) => {
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
        queryClient.setQueryData(historyKey, context.previousHistory)
      }
    },
    onSuccess: (data) => {
      if (!data) return
      queryClient.setQueryData(historyKey, (old: any) => {
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
      await queryClient.cancelQueries({ queryKey: historyKey })
      const previousHistory = queryClient.getQueryData(historyKey)

      queryClient.setQueryData(historyKey, (old: any) => {
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
        queryClient.setQueryData(historyKey, context.previousHistory)
      }
    },
    onSuccess: (data) => {
      if (!data) return
      queryClient.setQueryData(historyKey, (old: any) => {
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
      await queryClient.cancelQueries({ queryKey: historyKey })
      const previousHistory = queryClient.getQueryData(historyKey)

      queryClient.setQueryData(historyKey, (old: any) => {
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
        queryClient.setQueryData(historyKey, context.previousHistory)
      }
    },
    onSuccess: (data) => {
      if (!data) return
      queryClient.setQueryData(historyKey, (old: any) => {
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
      await queryClient.cancelQueries({ queryKey: historyKey })
      const previousHistory = queryClient.getQueryData(historyKey)

      queryClient.setQueryData(historyKey, (old: any) => {
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
        queryClient.setQueryData(historyKey, context.previousHistory)
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
      await queryClient.cancelQueries({ queryKey: historyKey })
      const previousHistory = queryClient.getQueryData(historyKey)

      queryClient.setQueryData(historyKey, (old: any) => {
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
        queryClient.setQueryData(historyKey, context.previousHistory)
      }
    },
    onSuccess: (data) => {
      if (!data) return
      queryClient.setQueryData(historyKey, (old: any) => {
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
      await queryClient.cancelQueries({ queryKey: historyKey })
      const previousHistory = queryClient.getQueryData(historyKey)

      queryClient.setQueryData(historyKey, (old: any) => {
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
        queryClient.setQueryData(historyKey, context.previousHistory)
      }
    },
    onSuccess: (data) => {
      if (!data) return
      queryClient.setQueryData(historyKey, (old: any) => {
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

  return { addTask, toggleTask, resetTask, deleteTask, updateTask, toggleMarked }
}
