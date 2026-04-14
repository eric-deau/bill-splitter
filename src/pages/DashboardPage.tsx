import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getReceiptsByUser } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import type { Receipt } from '@/types'

export function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) { navigate('/auth/login'); return }
    getReceiptsByUser(user!.id)
      .then(setReceipts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user, isAuthenticated, authLoading, navigate])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-7 border-2 border-ink-200 border-t-ink-700 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink-900">My receipts</h1>
          <p className="text-sm text-ink-500 font-body mt-1">
            {receipts.length} receipt{receipts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link to="/new">
          <Button variant="primary">+ New receipt</Button>
        </Link>
      </div>

      {receipts.length === 0 ? (
        <Card className="text-center py-12 space-y-4">
          <div className="text-4xl">🧾</div>
          <p className="font-display text-xl text-ink-900">No receipts yet</p>
          <p className="text-sm text-ink-500 font-body">
            Create your first receipt and share it with your group.
          </p>
          <Link to="/new">
            <Button variant="primary">Create a receipt</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {receipts.map((r) => (
            <Link key={r.id} to={`/r/${r.slug}`} className="block group">
              <Card className="hover:shadow-card transition-shadow duration-200 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-body font-medium text-ink-900 group-hover:text-sage-700 transition-colors truncate">
                        {r.name}
                      </span>
                      <Badge
                        variant={
                          r.status === 'open'
                            ? 'success'
                            : r.status === 'settled'
                            ? 'info'
                            : 'danger'
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-ink-400 font-body flex-wrap">
                      <span>{r.people_count} people</span>
                      <span>·</span>
                      <span>{new Date(r.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      {r.expires_at && (
                        <>
                          <span>·</span>
                          <span className="text-amber-600">Expires {new Date(r.expires_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-medium text-ink-900">
                      {formatCurrency(r.total)}
                    </p>
                    <p className="text-xs text-ink-400 font-body mt-0.5">
                      {formatCurrency(r.total / r.people_count)} / person
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
