import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../services/extensionTokenServer', () => ({
  getExtensionTokenFn: vi.fn().mockResolvedValue('test-token')
}))

let mockHistory: any = {}

vi.mock('../services/tasksServer', () => {
  return {
    getHistoryDataFn: vi.fn().mockImplementation(async () => {
      return mockHistory
    }),
    updateTaskFn: vi.fn().mockImplementation(async ({ data }) => {
      const { date, task } = data
      if (!mockHistory[date]) {
        mockHistory[date] = { tasks: [], globalTimer: { totalSeconds: 0, isRunning: false } }
      }
      
      const tasks = mockHistory[date].tasks
      const existingIdx = tasks.findIndex((t: any) => t.id === task.id)
      
      const normalizedTask = {
        ...task,
        startTime: task.startTime ? new Date(task.startTime).getTime() : undefined
      }

      if (existingIdx >= 0) {
        tasks[existingIdx] = normalizedTask
      } else {
        tasks.push(normalizedTask)
      }
      return normalizedTask
    }),
    deleteTaskFn: vi.fn().mockImplementation(async ({ data }) => {
      const { taskId } = data
      for (const date of Object.keys(mockHistory)) {
        mockHistory[date].tasks = mockHistory[date].tasks.filter((t: any) => t.id !== taskId)
      }
      return { success: true }
    }),
    updateDayMetricsFn: vi.fn().mockImplementation(async ({ data }) => {
      const { date, metrics } = data
      if (!mockHistory[date]) {
        mockHistory[date] = { tasks: [], globalTimer: { totalSeconds: 0, isRunning: false } }
      }
      if (metrics.globalTimer) {
        mockHistory[date].globalTimer = {
          totalSeconds: metrics.globalTimer.totalSeconds,
          isRunning: metrics.globalTimer.isRunning,
          startTime: metrics.globalTimer.startTime
        }
      }
      if (metrics.aiSummary !== undefined) {
        mockHistory[date].aiSummary = metrics.aiSummary
      }
      return mockHistory[date]
    }),
    deleteHistoryDayFn: vi.fn().mockImplementation(async ({ data }) => {
      const { date } = data
      delete mockHistory[date]
      return { success: true }
    })
  }
})

import { renderHook, act, waitFor } from '@testing-library/react'
import { useTasks } from './useTasks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'


const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: 0,
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useTasks', () => {
  let mockTimerRunning = false

  beforeEach(() => {
    localStorage.clear()
    const today = new Date().toISOString().split('T')[0]
    mockHistory = {
      [today]: {
        tasks: [],
        globalTimer: { totalSeconds: 0, isRunning: false }
      }
    }
    mockTimerRunning = false
    global.fetch = vi.fn().mockImplementation(async (url, options) => {
      const urlStr = typeof url === 'string' ? url : (url as any).url || ''
      if (urlStr.includes('/api/extension')) {
        let isRunning = !mockTimerRunning
        let accumulatedSeconds = 120
        if (options && options.body) {
          const body = JSON.parse(options.body)
          if (body.type === 'UPDATE_TIMER') {
            accumulatedSeconds = body.accumulatedSeconds
            isRunning = body.isRunning
          } else if (body.type === 'CLEAR_TIMER') {
            accumulatedSeconds = 0
            isRunning = false
            mockTimerRunning = false
          } else {
            mockTimerRunning = isRunning
          }
        } else {
          mockTimerRunning = isRunning
        }
        return {
          ok: true,
          json: async () => ({
            timerState: {
              isRunning,
              startTime: isRunning ? new Date().toISOString() : null,
              accumulatedSeconds
            }
          })
        } as Response
      }
      return { ok: true, json: async () => ({}) } as Response
    })
  })

  it('initially returns an empty list', () => {
    const { result } = renderHook(() => useTasks(), {
      wrapper: createWrapper(),
    })

    expect(result.current.tasks).toEqual([])
  })

  it('can add a task', async () => {
    const { result } = renderHook(() => useTasks(), {
      wrapper: createWrapper(),
    })
    
    await act(async () => {
      await result.current.addTask.mutateAsync({ name: 'Test Task' })
    })

    await waitFor(() => {
      expect(result.current.tasks.length).toBe(1)
    })
    expect(result.current.tasks[0].name).toBe('Test Task')
    expect(result.current.tasks[0].isRunning).toBe(true)
    expect(result.current.tasks[0].startTime).toBeDefined()
  })

  it('stops other running tasks when a new one is added', async () => {
    const { result } = renderHook(() => useTasks(), {
      wrapper: createWrapper(),
    })
    
    await act(async () => {
      await result.current.addTask.mutateAsync({ name: 'First Task' })
    })
    
    await waitFor(() => {
      expect(result.current.tasks.length).toBe(1)
    })
    expect(result.current.tasks[0].isRunning).toBe(true)
    
    await act(async () => {
      await result.current.addTask.mutateAsync({ name: 'Second Task' })
    })

    await waitFor(() => {
      const firstTask = result.current.tasks.find(t => t.name === 'First Task')
      const secondTask = result.current.tasks.find(t => t.name === 'Second Task')
      expect(firstTask?.isRunning).toBe(false)
      expect(secondTask?.isRunning).toBe(true)
    })
  })

  it('can toggle a task', async () => {
    const { result } = renderHook(() => useTasks(), {
      wrapper: createWrapper(),
    })
    
    await act(async () => {
      await result.current.addTask.mutateAsync({ name: 'Test Task' })
    })
    
    await waitFor(() => {
      expect(result.current.tasks.length).toBe(1)
    })
    const taskId = result.current.tasks[0].id
    
    await act(async () => {
      await result.current.toggleTask.mutateAsync(taskId)
    })
    
    await waitFor(() => {
      expect(result.current.tasks[0].isRunning).toBe(false)
    })
    expect(result.current.tasks[0].totalSeconds).toBeGreaterThanOrEqual(0)
    
    await act(async () => {
      await result.current.toggleTask.mutateAsync(taskId)
    })
    
    await waitFor(() => {
      expect(result.current.tasks[0].isRunning).toBe(true)
      expect(result.current.tasks[0].startTime).toBeDefined()
    })
  })

  it('can toggle global timer', async () => {
    const { result } = renderHook(() => useTasks(), {
      wrapper: createWrapper(),
    })

    expect(result.current.globalTimer.isRunning).toBe(false)

    await act(async () => {
      await result.current.toggleGlobalTimer.mutateAsync()
    })

    await waitFor(() => {
      expect(result.current.globalTimer.isRunning).toBe(true)
    })
    expect(result.current.globalTimer.startTime).toBeDefined()

    await act(async () => {
      await result.current.toggleGlobalTimer.mutateAsync()
    })

    await waitFor(() => {
      expect(result.current.globalTimer.isRunning).toBe(false)
    })
    expect(result.current.globalTimer.totalSeconds).toBeGreaterThanOrEqual(0)
  })

  it('can edit global timer value', async () => {
    const { result } = renderHook(() => useTasks(), {
      wrapper: createWrapper(),
    })

    expect(result.current.globalTimer.totalSeconds).toBe(0)

    await act(async () => {
      await result.current.updateGlobalTimer.mutateAsync(3600)
    })

    await waitFor(() => {
      expect(result.current.globalTimer.totalSeconds).toBe(3600)
    })
  })

  it('can toggle marked state', async () => {
    const { result } = renderHook(() => useTasks(), {
      wrapper: createWrapper(),
    })
    
    await act(async () => {
      await result.current.addTask.mutateAsync({ name: 'Test Task' })
    })
    
    await waitFor(() => {
      expect(result.current.tasks.length).toBe(1)
    })
    expect(result.current.tasks[0].isMarked).toBe(false)
    const taskId = result.current.tasks[0].id
    
    await act(async () => {
      await result.current.toggleMarked.mutateAsync(taskId)
    })
    
    await waitFor(() => {
      expect(result.current.tasks[0].isMarked).toBe(true)
    })
    
    await act(async () => {
      await result.current.toggleMarked.mutateAsync(taskId)
    })
    
    await waitFor(() => {
      expect(result.current.tasks[0].isMarked).toBe(false)
    })
  })
})
