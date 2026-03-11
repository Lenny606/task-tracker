import { useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

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

  dismiss: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id)
    notify()
  },
}
