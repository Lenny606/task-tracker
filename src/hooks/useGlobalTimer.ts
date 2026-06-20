import { useMutation, type QueryClient } from '@tanstack/react-query'
import { getExtensionTokenFn } from '../services/settingsServer'
import { updateDayMetricsFn } from '../services/tasksServer'

export interface GlobalTimer {
  totalSeconds: number
  isRunning: boolean
  startTime?: number
}

async function getValidatedExtensionBase(): Promise<{ base: string; token: string }> {
  const token = await getExtensionTokenFn()
  const base = typeof window !== 'undefined' && window.location.origin && !window.location.origin.startsWith('null')
    ? window.location.origin
    : 'http://localhost:3000'

  // SSRF mitigation: validate that destination origin is local or matches current host
  const allowedHosts = ['localhost:3000', 'localhost:5173', '127.0.0.1:3000', '127.0.0.1:5173']
  if (typeof window !== 'undefined' && window.location.host) {
    allowedHosts.push(window.location.host)
  }
  const parsedBase = new URL(base)
  if (!allowedHosts.includes(parsedBase.host)) {
    throw new Error('Blocked SSRF attempt: Invalid origin')
  }
  return { base, token }
}

export function useGlobalTimer(
  date: string,
  globalTimer: GlobalTimer,
  queryClient: QueryClient,
  historyKey: any[]
) {
  const toggleGlobalTimer = useMutation({
    mutationFn: async () => {
      const { base, token } = await getValidatedExtensionBase()

      // fallow-ignore-next-line security-sink
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
      await queryClient.cancelQueries({ queryKey: historyKey })
      const previousHistory = queryClient.getQueryData(historyKey)

      queryClient.setQueryData(historyKey, (old: any) => {
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
      await queryClient.cancelQueries({ queryKey: historyKey })
      const previousHistory = queryClient.getQueryData(historyKey)

      queryClient.setQueryData(historyKey, (old: any) => {
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
            globalTimer: data
          }
        }
      })
    }
  })

  const updateGlobalTimer = useMutation({
    mutationFn: async (newSeconds: number) => {
      const { base, token } = await getValidatedExtensionBase()

      const isRunning = globalTimer.isRunning
      const startTime = isRunning ? Date.now() : null

      // fallow-ignore-next-line security-sink
      const response = await fetch(`${base}/api/extension`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Extension-Auth': token
        },
        body: JSON.stringify({ 
          type: 'UPDATE_TIMER', 
          accumulatedSeconds: newSeconds,
          isRunning,
          startTime
        }),
      })
      
      if (!response.ok) throw new Error('Failed to update timer on server')
      const { timerState: serverState } = await response.json()

      const newTimer: GlobalTimer = {
        isRunning: serverState.isRunning,
        startTime: serverState.startTime,
        totalSeconds: serverState.accumulatedSeconds || 0
      }
      
      await updateDayMetricsFn({ data: { date, metrics: { globalTimer: newTimer } } })
      return newTimer
    },
    onMutate: async (newSeconds) => {
      await queryClient.cancelQueries({ queryKey: historyKey })
      const previousHistory = queryClient.getQueryData(historyKey)

      queryClient.setQueryData(historyKey, (old: any) => {
        const currentHistory = old || {}
        const day = currentHistory[date] || { tasks: [] }
        const timer = day.globalTimer || { totalSeconds: 0, isRunning: false }

        const newTimer: GlobalTimer = {
          isRunning: timer.isRunning,
          totalSeconds: newSeconds,
          startTime: timer.isRunning ? Date.now() : undefined
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
            globalTimer: data
          }
        }
      })
    }
  })

  return { toggleGlobalTimer, resetGlobalTimer, updateGlobalTimer }
}
