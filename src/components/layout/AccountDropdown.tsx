import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'

export function AccountDropdown() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const handleSignOut = async () => {
    setOpen(false)
    try {
      await signOut()
      toast.success('Signed out')
      navigate('/')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  const initial = user?.email?.[0].toUpperCase() ?? '?'
  const email = user?.email ?? ''

  return (
    <div className="relative" ref={ref}>
      {/* Avatar trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'size-8 rounded-full flex items-center justify-center',
          'text-xs font-medium font-body transition-all',
          'ring-2 ring-offset-2 ring-offset-cream-50',
          open
            ? 'bg-sage-700 text-white ring-sage-500'
            : 'bg-sage-100 text-sage-700 ring-transparent hover:ring-sage-300'
        )}
        aria-label="Account menu"
        aria-expanded={open}
      >
        {initial}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 w-56',
            'bg-white border border-ink-100 rounded-2xl shadow-lifted',
            'animate-fade-up origin-top-right',
            'z-50 overflow-hidden'
          )}
        >
          {/* Account header */}
          <div className="px-4 py-3 border-b border-ink-100 bg-cream-50">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-full bg-sage-200 flex items-center justify-center text-xs font-medium text-sage-700 shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-ink-900 font-body truncate">{email}</p>
                <p className="text-xs text-ink-400 font-body">Signed in</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <ul className="py-1.5">
            <MenuItem to="/dashboard" onClick={() => setOpen(false)} icon={<ReceiptsIcon />}>
              My receipts
            </MenuItem>
            <MenuItem to="/account" onClick={() => setOpen(false)} icon={<SettingsIcon />}>
              Account settings
            </MenuItem>
          </ul>

          {/* Sign out */}
          <div className="border-t border-ink-100 py-1.5">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 font-body hover:bg-rose-50 transition-colors text-left"
            >
              <SignOutIcon />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({
  to,
  onClick,
  icon,
  children,
}: {
  to: string
  onClick: () => void
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <li>
      <Link
        to={to}
        onClick={onClick}
        className="flex items-center gap-3 px-4 py-2 text-sm text-ink-700 font-body hover:bg-cream-50 transition-colors"
      >
        <span className="text-ink-400 size-4 flex items-center justify-center shrink-0">{icon}</span>
        {children}
      </Link>
    </li>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function ReceiptsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 2h10v10.5L9.5 11 7 12.5 4.5 11 2 12.5V2z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M4.5 5h5M4.5 7.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M2.93 2.93l1.06 1.06M10.01 10.01l1.06 1.06M2.93 11.07l1.06-1.06M10.01 3.99l1.06-1.06" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5.5 2H2.5A.5.5 0 0 0 2 2.5v9a.5.5 0 0 0 .5.5h3M9.5 10l2.5-3-2.5-3M12 7H5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
