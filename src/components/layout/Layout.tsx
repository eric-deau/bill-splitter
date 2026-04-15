import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { AccountDropdown } from '@/components/layout/AccountDropdown'
import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen bg-cream-50 font-body">
      {/* Nav */}
      <header className="sticky top-0 z-40 bg-cream-50/80 backdrop-blur-md border-b border-ink-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="size-7 bg-sage-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">÷</span>
            </div>
            <span className="font-display text-lg text-ink-900 group-hover:text-sage-700 transition-colors">
              IOU
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">My receipts</Button>
                </Link>
                <AccountDropdown />
              </>
            ) : (
              <>
                <Link to="/auth/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link to="/auth/signup">
                  <Button variant="primary" size="sm">Sign up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
