import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium font-body',
        {
          'bg-ink-100 text-ink-600': variant === 'default',
          'bg-sage-100 text-sage-700': variant === 'success',
          'bg-amber-100 text-amber-600': variant === 'warning',
          'bg-rose-100 text-rose-600': variant === 'danger',
          'bg-sky-100 text-sky-700': variant === 'info',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
