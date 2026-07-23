import { getSettings } from './settingsStore'

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading' | 'celebrate' | 'delete' | 'reminder' | 'star'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

type ToastListener = (toasts: Toast[]) => void

const MAX_VISIBLE = 3
const STAGGER_DELAY_MS = 250
const DEDUP_WINDOW_MS = 2000

let activeToasts: Toast[] = []
let pendingQueue: Toast[] = []
const listeners = new Set<ToastListener>()
const recentMessages = new Map<string, number>()

let isStaggering = false
let staggerTimer: ReturnType<typeof setTimeout> | null = null

const notify = () => {
  listeners.forEach((listener) => listener([...activeToasts]))
}

const processQueue = () => {
  if (isStaggering) return
  if (activeToasts.length >= MAX_VISIBLE) return
  if (pendingQueue.length === 0) return

  const nextToast = pendingQueue.shift()!
  activeToasts = [...activeToasts, nextToast]
  notify()

  isStaggering = true
  staggerTimer = setTimeout(() => {
    isStaggering = false
    staggerTimer = null
    processQueue()
  }, STAGGER_DELAY_MS)
}

// Request notification permission if supported
if (typeof window !== 'undefined' && 'Notification' in window) {
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission()
  }
}

export const toast = {
  subscribe: (listener: ToastListener) => {
    listeners.add(listener)
    listener([...activeToasts])
    return () => {
      listeners.delete(listener)
    }
  },

  show: (message: string, type: ToastType = 'info', duration = 4000): string => {
    const { notificationsEnabled } = getSettings()
    if (!notificationsEnabled) {
      return ''
    }

    const dedupKey = `${type}:${message}`
    const now = Date.now()
    const lastSeen = recentMessages.get(dedupKey)

    // Deduplicate rapid identical calls
    if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
      const existing = [...activeToasts, ...pendingQueue].find((t) => t.message === message && t.type === type)
      if (existing) return existing.id
    }

    recentMessages.set(dedupKey, now)

    // Prune old entries in recentMessages
    if (recentMessages.size > 50) {
      for (const [key, timestamp] of recentMessages.entries()) {
        if (now - timestamp > DEDUP_WINDOW_MS * 2) {
          recentMessages.delete(key)
        }
      }
    }

    const id = Math.random().toString(36).slice(2, 9)
    const newToast: Toast = { id, message, type, duration }

    // Background notifications
    if (typeof document !== 'undefined' && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification('Task Tracker', {
          body: message,
          icon: '/favicon.ico',
        })
      } catch (e) {
        console.warn('Failed to show background notification', e)
      }
    }

    pendingQueue.push(newToast)
    processQueue()

    return id
  },

  success: (message: string, duration?: number) => toast.show(message, 'success', duration),
  error: (message: string, duration?: number) => toast.show(message, 'error', duration),
  info: (message: string, duration?: number) => toast.show(message, 'info', duration),
  warning: (message: string, duration?: number) => toast.show(message, 'warning', duration),
  loading: (message: string, duration?: number) => toast.show(message, 'loading', duration),
  celebrate: (message: string, duration?: number) => toast.show(message, 'celebrate', duration),
  delete: (message: string, duration?: number) => toast.show(message, 'delete', duration),
  reminder: (message: string, duration?: number) => toast.show(message, 'reminder', duration),
  star: (message: string, duration?: number) => toast.show(message, 'star', duration),

  dismiss: (id: string) => {
    const wasActive = activeToasts.some((t) => t.id === id)
    activeToasts = activeToasts.filter((t) => t.id !== id)
    pendingQueue = pendingQueue.filter((t) => t.id !== id)

    notify()

    if (wasActive) {
      processQueue()
    }
  },

  clearAll: () => {
    activeToasts = []
    pendingQueue = []
    recentMessages.clear()
    if (staggerTimer) {
      clearTimeout(staggerTimer)
      staggerTimer = null
    }
    isStaggering = false
    notify()
  },
}

