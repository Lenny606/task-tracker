import { useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'loading' | 'celebrate' | 'delete' | 'reminder' | 'star'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

type ToastListener = (toasts: Toast[]) => void

let toasts: Toast[] = []
const listeners = new Set<ToastListener>()

const notify = () => {
  listeners.forEach((listener) => listener([...toasts]))
}

// Request notification permission on initialization if supported
if (typeof window !== 'undefined' && 'Notification' in window) {
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission()
  }
}

export const toast = {
  subscribe: (listener: ToastListener) => {
    listeners.add(listener)
    listener([...toasts])
    return () => listeners.delete(listener)
  },

  show: (message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2, 9)
    const newToast = { id, message, type, duration }
    toasts = [...toasts, newToast]
    notify()

    // Handle background notifications
    if (typeof document !== 'undefined' && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('TimeTrack Alert', {
        body: message,
        icon: '/favicon.ico', // Assuming there's a favicon
      })
    }

    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id)
      }, duration)
    }
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
    toasts = toasts.filter((t) => t.id !== id)
    notify()
  },
}
