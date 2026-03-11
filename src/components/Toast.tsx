import React, { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { toast, type Toast as ToastType } from '../store/toastStore'

const toastIcons = {
  success: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  info: <Info className="w-5 h-5 text-indigo-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
}

const toastStyles = {
  success: 'border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20',
  error: 'border-red-500/20 bg-red-50/50 dark:bg-red-950/20',
  info: 'border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-950/20',
  warning: 'border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20',
}

export function Toast({ id, message, type }: ToastType) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Small delay for entry animation
    const raf = requestAnimationFrame(() => setIsVisible(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border backdrop-blur-md shadow-lg transition-all duration-300 transform ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-0 scale-95'
      } ${toastStyles[type]}`}
    >
      <div className="shrink-0">{toastIcons[type]}</div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{message}</p>
      <button
        onClick={() => toast.dismiss(id)}
        className="ml-auto p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-400 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
