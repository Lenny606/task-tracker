import React, { useEffect, useState } from 'react'
import { toast, type Toast as ToastType } from '../store/toastStore'
import { Toast } from './Toast'

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastType[]>([])

  useEffect(() => {
    return toast.subscribe((newToasts) => {
      setToasts(newToasts)
    })
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-full max-w-lg pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} />
        </div>
      ))}
    </div>
  )
}
