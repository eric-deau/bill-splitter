import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { toast } from '@/components/ui/Toast'
import { updateSplitMode, updateMemberSplitOverride } from '@/lib/api'
import { formatCurrency, cn } from '@/lib/utils'
import {
  SPLIT_MODE_LABELS,
  SPLIT_MODE_DESCRIPTIONS,
  type SplitMode,
  type SplitConfig,
  type MemberWithItems,
  type Receipt,
} from '@/types'

interface SplitModePanelProps {
  receipt: Receipt
  members: MemberWithItems[]
  onUpdate: () => void
}

const ALL_MODES: SplitMode[] = ['equal', 'items', 'percentage', 'fixed', 'shares']

export function SplitModePanel({ receipt, members, onUpdate }: SplitModePanelProps) {
  const [open, setOpen] = useState(false)
  const [activeMode, setActiveMode] = useState<SplitMode>(receipt.split_mode)
  const [config, setConfig] = useState<SplitConfig>(receipt.split_config)
  const [saving, setSaving] = useState(false)
  // Local draft values for the inputs — strings so inputs stay controlled cleanly
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  // Sync if receipt updates externally (realtime)
  useEffect(() => {
    setActiveMode(receipt.split_mode)
    setConfig(receipt.split_config)
  }, [receipt.split_mode, receipt.split_config])

  // Initialise draft values from config whenever mode or members change
  useEffect(() => {
    const next: Record<string, string> = {}
    const overrides = config.overrides ?? {}
    const memberCount = members.length || 1
    for (const m of members) {
      switch (activeMode) {
        case 'percentage':
          next[m.id] = String(overrides[m.id]?.percentage ?? (100 / memberCount).toFixed(2))
          break
        case 'fixed':
          next[m.id] = String(overrides[m.id]?.fixed ?? (receipt.total / memberCount).toFixed(2))
          break
        case 'shares':
          next[m.id] = String(overrides[m.id]?.shares ?? 1)
          break
      }
    }
    setDrafts(next)
  }, [activeMode, members, config, receipt.total])

  const handleModeChange = async (mode: SplitMode) => {
    if (mode === activeMode) return
    setSaving(true)
    try {
      await updateSplitMode(receipt.id, mode, config)
      setActiveMode(mode)
      toast.success(`Split mode: ${SPLIT_MODE_LABELS[mode]}`)
      onUpdate()
    } catch {
      toast.error('Failed to update split mode')
    } finally {
      setSaving(false)
    }
  }

  const handleOverrideSave = async (memberId: string) => {
    const raw = drafts[memberId]
    const value = parseFloat(raw)
    if (isNaN(value) || value < 0) {
      toast.error('Enter a valid number')
      return
    }

    let override = {}
    let validationError: string | null = null

    if (activeMode === 'percentage') {
      // Validate total doesn't exceed 100
      const othersTotal = members
        .filter((m) => m.id !== memberId)
        .reduce((sum, m) => sum + (config.overrides[m.id]?.percentage ?? (100 / members.length)), 0)
      if (othersTotal + value > 100.01) {
        validationError = `${value}% would bring the total over 100%. Others are already at ${othersTotal.toFixed(1)}%.`
      }
      override = { percentage: value }
    } else if (activeMode === 'fixed') {
      override = { fixed: value }
    } else if (activeMode === 'shares') {
      if (value <= 0) validationError = 'Shares must be greater than 0'
      override = { shares: value }
    }

    if (validationError) {
      toast.error(validationError)
      return
    }

    setSaving(true)
    try {
      await updateMemberSplitOverride(receipt.id, memberId, override, config)
      setConfig((prev) => ({
        overrides: {
          ...prev.overrides,
          [memberId]: { ...prev.overrides[memberId], ...override },
        },
      }))
      onUpdate()
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // Computed validation hints
  const percentageTotal = activeMode === 'percentage'
    ? members.reduce((sum, m) => sum + (config.overrides[m.id]?.percentage ?? (100 / members.length)), 0)
    : 0

  const fixedTotal = activeMode === 'fixed'
    ? members.reduce((sum, m) => sum + (config.overrides[m.id]?.fixed ?? (receipt.total / members.length)), 0)
    : 0

  const totalShares = activeMode === 'shares'
    ? members.reduce((sum, m) => sum + (config.overrides[m.id]?.shares ?? 1), 0)
    : 0

  return (
    <div className="bg-white border border-ink-100 rounded-2xl shadow-soft overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-cream-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-ink-100 flex items-center justify-center text-base">
            ⚖️
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-ink-900 font-body">Split mode</p>
            <p className="text-xs text-ink-400 font-body">
              {SPLIT_MODE_LABELS[activeMode]} · {SPLIT_MODE_DESCRIPTIONS[activeMode].toLowerCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-ink-100 text-ink-600 px-2 py-0.5 rounded-md font-body font-medium">
            {SPLIT_MODE_LABELS[activeMode]}
          </span>
          <svg
            className={cn('size-4 text-ink-400 transition-transform', open && 'rotate-180')}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-ink-100 animate-fade-up">
          {/* Mode selector */}
          <div className="p-4 grid grid-cols-5 gap-1.5">
            {ALL_MODES.map((mode) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                disabled={saving}
                className={cn(
                  'flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border text-center transition-all',
                  'disabled:opacity-50',
                  activeMode === mode
                    ? 'border-ink-900 bg-ink-900 text-white'
                    : 'border-ink-100 bg-cream-50 text-ink-700 hover:border-ink-300 hover:bg-cream-100'
                )}
              >
                <span className="text-sm">{MODE_ICONS[mode]}</span>
                <span className="text-[10px] font-medium font-body leading-tight">
                  {SPLIT_MODE_LABELS[mode]}
                </span>
              </button>
            ))}
          </div>

          {/* Description */}
          <p className="px-4 pb-3 text-xs text-ink-500 font-body">
            {SPLIT_MODE_DESCRIPTIONS[activeMode]}
          </p>

          {/* Per-member config — only shown for modes that need it */}
          {(activeMode === 'percentage' || activeMode === 'fixed' || activeMode === 'shares') && (
            <div className="border-t border-ink-100">
              {/* Validation summary */}
              {activeMode === 'percentage' && (
                <div className={cn(
                  'mx-4 mt-4 px-3 py-2 rounded-xl text-xs font-body flex items-center justify-between',
                  Math.abs(percentageTotal - 100) < 0.1
                    ? 'bg-sage-50 text-sage-700'
                    : percentageTotal > 100
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-amber-50 text-amber-700'
                )}>
                  <span>Total assigned</span>
                  <span className="font-medium font-mono">{percentageTotal.toFixed(1)}%</span>
                </div>
              )}
              {activeMode === 'fixed' && (
                <div className={cn(
                  'mx-4 mt-4 px-3 py-2 rounded-xl text-xs font-body flex items-center justify-between',
                  Math.abs(fixedTotal - receipt.total) < 0.01
                    ? 'bg-sage-50 text-sage-700'
                    : fixedTotal > receipt.total
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-amber-50 text-amber-700'
                )}>
                  <span>
                    Total assigned · {formatCurrency(Math.abs(receipt.total - fixedTotal))}{' '}
                    {fixedTotal > receipt.total ? 'over' : 'remaining'}
                  </span>
                  <span className="font-medium font-mono">{formatCurrency(fixedTotal)}</span>
                </div>
              )}
              {activeMode === 'shares' && (
                <div className="mx-4 mt-4 px-3 py-2 rounded-xl text-xs font-body bg-ink-50 text-ink-600 flex items-center justify-between">
                  <span>Total shares</span>
                  <span className="font-medium font-mono">{totalShares.toFixed(1)}</span>
                </div>
              )}

              {/* Per-member rows */}
              <ul className="divide-y divide-ink-50 px-4 py-2">
                {members.map((member) => (
                  <MemberOverrideRow
                    key={member.id}
                    member={member}
                    mode={activeMode}
                    draftValue={drafts[member.id] ?? ''}
                    amountDue={member.amount_due}
                    onDraftChange={(val) =>
                      setDrafts((prev) => ({ ...prev, [member.id]: val }))
                    }
                    onSave={() => handleOverrideSave(member.id)}
                    saving={saving}
                    receipt={receipt}
                    totalShares={totalShares}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Items mode info */}
          {activeMode === 'items' && (
            <div className="border-t border-ink-100 px-4 py-4">
              <ul className="space-y-2">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <Avatar name={m.name} color={m.color} size="sm" />
                    <span className="text-sm text-ink-700 font-body flex-1">{m.name}</span>
                    <span className="font-mono text-sm text-ink-800">
                      {formatCurrency(m.subtotal)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Equal mode info */}
          {activeMode === 'equal' && (
            <div className="border-t border-ink-100 px-4 py-4">
              <ul className="space-y-2">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <Avatar name={m.name} color={m.color} size="sm" />
                    <span className="text-sm text-ink-700 font-body flex-1">{m.name}</span>
                    <span className="font-mono text-sm text-ink-800">
                      {formatCurrency(receipt.total / members.length)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Per-member override row ──────────────────────────────────────────────────

interface MemberOverrideRowProps {
  member: MemberWithItems
  mode: SplitMode
  draftValue: string
  amountDue: number
  onDraftChange: (val: string) => void
  onSave: () => void
  saving: boolean
  receipt: Receipt
  totalShares: number
}

function MemberOverrideRow({
  member,
  mode,
  draftValue,
  amountDue,
  onDraftChange,
  onSave,
  saving,
  receipt,
  totalShares,
}: MemberOverrideRowProps) {
  const placeholder = mode === 'percentage' ? '33.3' : mode === 'fixed' ? '0.00' : '1'
  const prefix = mode === 'fixed' ? '$' : undefined
  const suffix = mode === 'percentage' ? '%' : mode === 'shares' ? 'shares' : undefined

  return (
    <li className="py-3 flex items-center gap-3">
      <Avatar name={member.name} color={member.color} size="sm" />
      <span className="text-sm font-body text-ink-800 flex-1 min-w-0 truncate">{member.name}</span>

      {/* Input */}
      <div className="flex items-center gap-1.5 shrink-0">
        {prefix && <span className="text-xs text-ink-400 font-body">{prefix}</span>}
        <input
          type="number"
          min="0"
          step={mode === 'shares' ? '0.5' : '0.01'}
          value={draftValue}
          onChange={(e) => onDraftChange(e.target.value)}
          onBlur={onSave}
          onKeyDown={(e) => e.key === 'Enter' && onSave()}
          disabled={saving}
          className={cn(
            'w-20 px-2 py-1.5 text-sm font-mono text-right rounded-lg border border-ink-100',
            'focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500',
            'bg-cream-50 text-ink-900 disabled:opacity-50'
          )}
          placeholder={placeholder}
        />
        {suffix && <span className="text-xs text-ink-400 font-body">{suffix}</span>}
      </div>

      {/* Computed amount */}
      <span className="font-mono text-sm text-ink-600 w-16 text-right shrink-0">
        {formatCurrency(amountDue)}
      </span>
    </li>
  )
}

const MODE_ICONS: Record<SplitMode, string> = {
  equal:      '÷',
  items:      '🧾',
  percentage: '%',
  fixed:      '$',
  shares:     '⚖',
}
