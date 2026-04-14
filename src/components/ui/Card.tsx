import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

export function Card({ children, className, padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-ink-100 rounded-2xl shadow-soft',
        {
          'p-4': padding === 'sm',
          'p-6': padding === 'md',
          'p-8': padding === 'lg',
          'p-0': padding === 'none',
        },
        className
      )}
    >
      {children}
    </div>
  )
}

interface CardSectionProps {
  children: ReactNode
  className?: string
}

export function CardSection({ children, className }: CardSectionProps) {
  return (
    <div className={cn('border-t border-ink-100 pt-4 mt-4', className)}>
      {children}
    </div>
  )
}
