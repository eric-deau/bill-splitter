import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.97]',
          {
            // variants
            'bg-ink-900 text-cream-50 hover:bg-ink-800 border border-ink-900':
              variant === 'primary',
            'bg-cream-100 text-ink-800 border border-ink-200 hover:bg-cream-200 hover:border-ink-300':
              variant === 'secondary',
            'text-ink-700 hover:bg-cream-100 border border-transparent hover:border-ink-100':
              variant === 'ghost',
            'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100':
              variant === 'danger',
            // sizes
            'text-xs px-3 py-1.5 rounded-lg': size === 'sm',
            'text-sm px-4 py-2 rounded-xl': size === 'md',
            'text-base px-6 py-3 rounded-xl': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
