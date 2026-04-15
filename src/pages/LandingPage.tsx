import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/utils'

const DEMO_MEMBERS = [
  { name: 'Alex', color: 'bg-sage-100 text-sage-700', items: ['Salmon roll', 'Sake'], total: 38.50 },
  { name: 'Jordan', color: 'bg-amber-100 text-amber-600', items: ['Wagyu skewer', 'Matcha'], total: 44.00 },
  { name: 'Sam', color: 'bg-rose-100 text-rose-600', items: ['Edamame', 'Tempura'], total: 27.50 },
]

export function LandingPage() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="space-y-24 pb-16">
      {/* Hero */}
      <section className="pt-12 pb-4 text-center max-w-2xl mx-auto space-y-6">
        <h1 className="font-display text-5xl sm:text-6xl text-ink-900 leading-[1.1] animate-fade-up">
          Split bills<br />
          <em className="text-sage-600 not-italic">without the headaches.</em>
        </h1>

        <p className="text-lg text-ink-500 font-body leading-relaxed animate-fade-up" style={{ animationDelay: '0.1s', opacity: 0, animationFillMode: 'forwards' }}>
          Create a shared receipt, invite your group, and track who ordered what — updated live for everyone on the link.
        </p>

        <div className="flex items-center justify-center gap-3 flex-wrap animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0, animationFillMode: 'forwards' }}>
          <Link to="/new">
            <Button variant="primary" size="lg">
              Create a receipt
            </Button>
          </Link>
          {!isAuthenticated && (
            <Link to="/auth/signup">
              <Button variant="secondary" size="lg">
                Sign up free
              </Button>
            </Link>
          )}
        </div>

        <p className="text-xs text-ink-400 font-body animate-fade-up" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
          Guest receipts expire in 24 hrs · Sign up to save them forever
        </p>
      </section>

      {/* Demo receipt preview */}
      <section className="max-w-sm mx-auto animate-fade-up" style={{ animationDelay: '0.4s', opacity: 0, animationFillMode: 'forwards' }}>
        <div className="bg-white rounded-3xl border border-ink-100 shadow-card overflow-hidden">
          {/* Mock header */}
          <div className="px-5 py-4 border-b border-ink-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-base text-ink-900">Dinner at Miku</p>
                <p className="text-xs text-ink-400 font-body mt-0.5">3 people · {formatCurrency(110)}</p>
              </div>
              <span className="text-xs bg-sage-100 text-sage-700 px-2 py-1 rounded-md font-body font-medium">open</span>
            </div>
            <div className="mt-3 h-1.5 bg-ink-100 rounded-full overflow-hidden">
              <div className="h-full bg-sage-500 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
          {/* Mock members */}
          <ul className="divide-y divide-ink-50">
            {DEMO_MEMBERS.map((m) => (
              <li key={m.name} className="px-5 py-3 flex items-center gap-3">
                <div className={`size-8 rounded-full flex items-center justify-center text-xs font-medium font-body ${m.color}`}>
                  {m.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 font-body">{m.name}</p>
                  <p className="text-xs text-ink-400 font-body truncate">{m.items.join(', ')}</p>
                </div>
                <span className="font-mono text-sm text-ink-800">{formatCurrency(m.total)}</span>
              </li>
            ))}
          </ul>
          {/* Mock footer */}
          <div className="px-5 py-3 bg-cream-50 border-t border-ink-100">
            <p className="text-xs text-ink-500 font-body">
              Send e-transfer to <span className="font-medium text-ink-800">alex@email.com</span>
            </p>
          </div>
        </div>
      </section>

      {/* Feature bullets */}
      <section className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {[
          {
            icon: '🔗',
            title: 'Just share a link',
            body: 'No app download, no login required for guests. One URL is all it takes.',
          },
          {
            icon: '🔒',
            title: 'Save receipts forever',
            body: 'Create an account to keep receipts beyond 24 hours and manage them in one dashboard.',
          },
        ].map((f) => (
          <div key={f.title} className="space-y-2">
            <div className="text-2xl">{f.icon}</div>
            <h3 className="font-display text-base text-ink-900">{f.title}</h3>
            <p className="text-sm text-ink-500 font-body leading-relaxed">{f.body}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
