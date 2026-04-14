import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  prefix?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, prefix, ...props }, ref) => {
    return (
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 font-body text-sm pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full font-body text-sm text-ink-900 bg-white border rounded-xl px-3 py-2.5',
            'placeholder:text-ink-300 transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500',
            'disabled:opacity-50 disabled:bg-cream-100',
            prefix && 'pl-7',
            error
              ? 'border-rose-400 focus:ring-rose-400 focus:border-rose-400'
              : 'border-ink-100 hover:border-ink-200',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-rose-500 font-body">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// ─── Label ────────────────────────────────────────────────────────────────────

interface LabelProps {
  children: ReactNode
  htmlFor?: string
  optional?: boolean
}

export function Label({ children, htmlFor, optional }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium text-ink-600 mb-1.5 font-body tracking-wide"
    >
      {children}
      {optional && <span className="ml-1.5 text-ink-300 font-normal">(optional)</span>}
    </label>
  )
}

// ─── FormField ────────────────────────────────────────────────────────────────

interface FormFieldProps {
  label: string
  htmlFor: string
  optional?: boolean
  children: ReactNode
  hint?: string
}

export function FormField({ label, htmlFor, optional, children, hint }: FormFieldProps) {
  return (
    <div className="space-y-0">
      <Label htmlFor={htmlFor} optional={optional}>
        {label}
      </Label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-400 font-body">{hint}</p>}
    </div>
  )
}
