import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
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
  beforeEach(() => {
    localStorage.clear()
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
      await result.current.addTask.mutateAsync('Test Task')
    })

    expect(result.current.tasks.length).toBe(1)
    expect(result.current.tasks[0].name).toBe('Test Task')
  })

  it('can toggle a task', async () => {
    const { result } = renderHook(() => useTasks(), {
      wrapper: createWrapper(),
    })
    
    await act(async () => {
      await result.current.addTask.mutateAsync('Test Task')
    })
    
    const taskId = result.current.tasks[0].id
    
    await act(async () => {
      await result.current.toggleTask.mutateAsync(taskId)
    })
    
    expect(result.current.tasks[0].isRunning).toBe(true)
    expect(result.current.tasks[0].startTime).toBeDefined()
    
    await act(async () => {
      await result.current.toggleTask.mutateAsync(taskId)
    })
    
    expect(result.current.tasks[0].isRunning).toBe(false)
    expect(result.current.tasks[0].totalSeconds).toBeGreaterThanOrEqual(0)
  })

  it('can toggle global timer', async () => {
    const { result } = renderHook(() => useTasks(), {
      wrapper: createWrapper(),
    })

    expect(result.current.globalTimer.isRunning).toBe(false)

    await act(async () => {
      await result.current.toggleGlobalTimer.mutateAsync()
    })

    expect(result.current.globalTimer.isRunning).toBe(true)
    expect(result.current.globalTimer.startTime).toBeDefined()

    await act(async () => {
      await result.current.toggleGlobalTimer.mutateAsync()
    })

    expect(result.current.globalTimer.isRunning).toBe(false)
    expect(result.current.globalTimer.totalSeconds).toBeGreaterThanOrEqual(0)
  })
})
