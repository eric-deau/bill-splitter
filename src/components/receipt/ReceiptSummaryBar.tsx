import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { toast } from '@/components/ui/Toast'
import { formatCurrency, timeUntilExpiry, cn } from '@/lib/utils'
import { SPLIT_MODE_LABELS, type ReceiptSummary } from '@/types'

interface ReceiptSummaryBarProps {
  summary: ReceiptSummary
  onSettle?: () => void
  isHost: boolean
}

export function ReceiptSummaryBar({ summary, onSettle, isHost }: ReceiptSummaryBarProps) {
  const { receipt, is_balanced, even_split, split_remainder, members } = summary
  const [copied, setCopied] = useState(false)

  const shareUrl = window.location.href
  const totalAmountDue = members.reduce((s, m) => s + m.amount_due, 0)
  const progressPct = Math.min(100, (totalAmountDue / receipt.total) * 100)
  const isOver = totalAmountDue > receipt.total + 0.01

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white border border-ink-100 rounded-2xl shadow-soft p-5 space-y-4">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-ink-900 leading-tight">{receipt.name}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant={receipt.status === 'open' ? 'success' : receipt.status === 'settled' ? 'info' : 'danger'}>
              {receipt.status}
            </Badge>
            <Badge variant="default">
              {SPLIT_MODE_LABELS[receipt.split_mode]}
            </Badge>
            {receipt.expires_at && (
              <span className="text-xs text-ink-400 font-body">
                {timeUntilExpiry(receipt.expires_at)}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? '✓ Copied' : 'Share link'}
          </Button>
          {isHost && receipt.status === 'open' && (
            <Button variant="ghost" size="sm" onClick={onSettle}>
              Settle
            </Button>
          )}
        </div>
      </div>

      {/* E-transfer info */}
      <div className="flex items-center gap-2 bg-sage-50 border border-sage-200 rounded-xl px-4 py-2.5">
        <span className="text-xs text-sage-600 font-body">Send e-transfer to</span>
        <span className="text-sm font-medium text-sage-800 font-body flex-1">{receipt.etransfer_email}</span>
        {receipt.etransfer_note && (
          <span className="text-xs text-sage-500 font-body italic">"{receipt.etransfer_note}"</span>
        )}
      </div>

      {/* Totals grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCell label="Bill total" value={formatCurrency(receipt.total)} />
        <StatCell
          label="Total assigned"
          value={formatCurrency(totalAmountDue)}
          highlight={is_balanced}
          warn={isOver}
        />
        <StatCell
          label={isOver ? 'Over by' : 'Remaining'}
          value={formatCurrency(Math.abs(split_remainder))}
          muted={is_balanced}
          warn={!is_balanced && isOver}
          alert={!is_balanced && split_remainder > 0.01}
        />
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isOver ? 'bg-rose-400' : is_balanced ? 'bg-sage-500' : 'bg-amber-400'
            )}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-ink-400 font-body">
          <span>
            {receipt.split_mode === 'equal'
              ? `Even split: ${formatCurrency(even_split)} / person`
              : `${SPLIT_MODE_LABELS[receipt.split_mode]} · ${members.length} people`}
          </span>
          <span>{Math.round(progressPct)}% allocated</span>
        </div>
      </div>
    </div>
  )
}

function StatCell({
  label,
  value,
  highlight,
  muted,
  warn,
  alert,
}: {
  label: string
  value: string
  highlight?: boolean
  muted?: boolean
  warn?: boolean
  alert?: boolean
}) {
  return (
    <div className="bg-cream-50 rounded-xl p-3">
      <p className="text-xs text-ink-400 font-body mb-1">{label}</p>
      <p className={cn(
        'font-mono text-sm font-medium',
        highlight ? 'text-sage-700'
        : warn ? 'text-rose-500'
        : alert ? 'text-amber-600'
        : muted ? 'text-ink-300'
        : 'text-ink-900'
      )}>
        {value}
      </p>
    </div>
  )
}
