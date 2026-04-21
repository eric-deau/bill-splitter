import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

// Simple module-level store so toasts can be triggered from anywhere
let listeners: Array<(toast: Toast) => void> = []

export function toast(message: string, type: ToastType = 'info') {
  const id = Math.random().toString(36).slice(2)
  listeners.forEach((fn) => fn({ id, message, type }))
}

toast.success = (msg: string) => toast(msg, 'success')
toast.error = (msg: string) => toast(msg, 'error')

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts((prev) => [...prev, t])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id))
      }, 3500)
    }
    listeners.push(handler)
    return () => {
      listeners = listeners.filter((fn) => fn !== handler)
    }
  }, [])

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'animate-fade-up px-5 py-3 rounded-2xl text-sm font-body font-medium shadow-lifted',
            'pointer-events-auto select-none',
            {
              'bg-sage-700 text-white': t.type === 'success',
              'bg-rose-600 text-white': t.type === 'error',
              'bg-ink-900 text-cream-50': t.type === 'info',
            }
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
