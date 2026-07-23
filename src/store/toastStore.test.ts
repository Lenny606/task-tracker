import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { toast } from './toastStore'

describe('toastStore Queue & Staggering', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    toast.clearAll()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows toasts up to MAX_VISIBLE (3) and queues remaining toasts', () => {
    const received: string[][] = []
    const unsubscribe = toast.subscribe((toasts) => {
      received.push(toasts.map((t) => t.message))
    })

    toast.info('Message 1')
    toast.info('Message 2')
    toast.info('Message 3')
    toast.info('Message 4')

    // At t=0, only Message 1 is active, others are staggering / in pending queue
    expect(received[received.length - 1]).toEqual(['Message 1'])

    // Advance 250ms for stagger
    vi.advanceTimersByTime(250)
    expect(received[received.length - 1]).toEqual(['Message 1', 'Message 2'])

    // Advance 250ms for stagger
    vi.advanceTimersByTime(250)
    expect(received[received.length - 1]).toEqual(['Message 1', 'Message 2', 'Message 3'])

    // Advance 250ms -> MAX_VISIBLE (3) reached, Message 4 remains in pending queue
    vi.advanceTimersByTime(250)
    expect(received[received.length - 1]).toEqual(['Message 1', 'Message 2', 'Message 3'])

    unsubscribe()
  })

  it('deduplicates rapid identical toast calls', () => {
    const received: string[][] = []
    const unsubscribe = toast.subscribe((toasts) => {
      received.push(toasts.map((t) => t.message))
    })

    const id1 = toast.success('Saved successfully')
    const id2 = toast.success('Saved successfully')

    expect(id1).toBe(id2)
    expect(received[received.length - 1]).toEqual(['Saved successfully'])

    unsubscribe()
  })

  it('promotes queued toast when an active toast is dismissed', () => {
    const received: string[][] = []
    const unsubscribe = toast.subscribe((toasts) => {
      received.push(toasts.map((t) => t.message))
    })

    const id1 = toast.info('Toast 1')
    toast.info('Toast 2')
    toast.info('Toast 3')
    toast.info('Toast 4')

    // Fast-forward so Toast 1, Toast 2, Toast 3 are visible
    vi.advanceTimersByTime(1000)
    expect(received[received.length - 1]).toEqual(['Toast 1', 'Toast 2', 'Toast 3'])

    // Dismiss Toast 1
    toast.dismiss(id1)

    // Toast 4 should immediately promote into active toasts
    expect(received[received.length - 1]).toEqual(['Toast 2', 'Toast 3', 'Toast 4'])

    unsubscribe()
  })

  it('suppresses toasts when notifications are disabled in settings', async () => {
    const { getSettings } = await import('./settingsStore')
    const settings = getSettings()
    settings.notificationsEnabled = false

    const received: string[][] = []
    const unsubscribe = toast.subscribe((toasts) => {
      received.push(toasts.map((t) => t.message))
    })

    const id = toast.info('Should not show')

    expect(id).toBe('')
    expect(received[received.length - 1]).toEqual([])

    // Restore setting for other tests
    settings.notificationsEnabled = true
    unsubscribe()
  })
})
