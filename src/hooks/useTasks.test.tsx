import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTasks } from './useTasks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const queryClient = new QueryClient()
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
)

describe('useTasks', () => {
  beforeEach(() => {
    localStorage.clear()
    queryClient.clear()
  })

  it('initially returns an empty list', () => {
    const { result } = renderHook(() => useTasks(), { wrapper })
    expect(result.current.tasks).toEqual([])
  })

  it('can add a task', async () => {
    const { result } = renderHook(() => useTasks(), { wrapper })
    
    await act(async () => {
      result.current.addTask.mutate('Test Task')
    })

    expect(result.current.tasks.length).toBe(1)
    expect(result.current.tasks[0].name).toBe('Test Task')
  })

  it('can toggle a task', async () => {
    const { result } = renderHook(() => useTasks(), { wrapper })
    
    await act(async () => {
      result.current.addTask.mutate('Test Task')
    })
    
    const taskId = result.current.tasks[0].id
    
    await act(async () => {
      result.current.toggleTask.mutate(taskId)
    })
    
    expect(result.current.tasks[0].isRunning).toBe(true)
    expect(result.current.tasks[0].startTime).toBeDefined()
    
    await act(async () => {
      result.current.toggleTask.mutate(taskId)
    })
    
    expect(result.current.tasks[0].isRunning).toBe(false)
    expect(result.current.tasks[0].totalSeconds).toBeGreaterThanOrEqual(0)
  })
})
