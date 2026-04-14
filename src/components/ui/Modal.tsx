import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={cn(
          'relative w-full max-w-md bg-white rounded-3xl shadow-lifted animate-slide-in',
          'border border-ink-100',
          className
        )}
      >
        <div className="flex items-center justify-between p-6 pb-4 border-b border-ink-100">
          <h2 className="font-display text-lg text-ink-900">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="!px-2">
            <span className="text-base">✕</span>
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
