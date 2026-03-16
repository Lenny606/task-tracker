import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useTasks } from './useTasks'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 0,
      retry: false,
    },
  },
})

describe('useTasks', () => {
  beforeEach(() => {
    localStorage.clear()
    queryClient.clear()
  })

  it('initially returns an empty list', () => {
    let result: any
    function TestComponent() {
      result = useTasks()
      return <div>Tasks length: {result.tasks.length}</div>
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    )

    expect(result.tasks).toEqual([])
  })

  it('can add a task', async () => {
    let result: any
    function TestComponent() {
      result = useTasks()
      return <div>{result.tasks.length}</div>
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    )
    
    await act(async () => {
      await result.addTask.mutateAsync('Test Task')
    })

    expect(result.tasks.length).toBe(1)
    expect(result.tasks[0].name).toBe('Test Task')
  })

  it('can toggle a task', async () => {
    let result: any
    function TestComponent() {
      result = useTasks()
      return <div>{result.tasks.length}</div>
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    )
    
    await act(async () => {
      await result.addTask.mutateAsync('Test Task')
    })
    
    const taskId = result.tasks[0].id
    
    await act(async () => {
      await result.toggleTask.mutateAsync(taskId)
    })
    
    expect(result.tasks[0].isRunning).toBe(true)
    expect(result.tasks[0].startTime).toBeDefined()
    
    await act(async () => {
      await result.toggleTask.mutateAsync(taskId)
    })
    
    expect(result.tasks[0].isRunning).toBe(false)
    expect(result.tasks[0].totalSeconds).toBeGreaterThanOrEqual(0)
  })

  it('can toggle global timer', async () => {
    let result: any
    function TestComponent() {
      result = useTasks()
      return <div>Global Timer Running: {String(result.globalTimer.isRunning)}</div>
    }

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent />
      </QueryClientProvider>
    )

    expect(result.globalTimer.isRunning).toBe(false)

    await act(async () => {
      await result.toggleGlobalTimer.mutateAsync()
    })

    expect(result.globalTimer.isRunning).toBe(true)
    expect(result.globalTimer.startTime).toBeDefined()

    await act(async () => {
      await result.toggleGlobalTimer.mutateAsync()
    })

    expect(result.globalTimer.isRunning).toBe(false)
    expect(result.globalTimer.totalSeconds).toBeGreaterThanOrEqual(0)
  })
})
