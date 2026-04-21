import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useReceipt } from '@/hooks/useReceipt'
import { useAuth } from '@/hooks/useAuth'
import { ReceiptSummaryBar } from '@/components/receipt/ReceiptSummaryBar'
import { MemberCard } from '@/components/receipt/MemberCard'
import { AddMemberModal } from '@/components/receipt/AddMemberModal'
import { SplitModePanel } from '@/components/receipt/SplitModePanel'
import { Button } from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { settleReceipt } from '@/lib/api'

export function ReceiptPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, loading, error, refetch } = useReceipt(slug)
  const { user } = useAuth()
  const [addMemberOpen, setAddMemberOpen] = useState(false)

  // Optimistic removal: IDs of members removed locally before Realtime confirms
  const [removedMemberIds, setRemovedMemberIds] = useState<Set<string>>(new Set())

  const isHost =
    !!user &&
    !!data?.receipt.host_user_id &&
    user.id === data.receipt.host_user_id

  // Filter out optimistically removed members immediately for a snappy UI
  const visibleMembers = useMemo(
    () => (data?.members ?? []).filter((m) => !removedMemberIds.has(m.id)),
    [data?.members, removedMemberIds]
  )

  const handleMemberRemoved = (memberId: string) => {
    setRemovedMemberIds((prev) => new Set([...prev, memberId]))
    // Realtime will trigger a refetch shortly; clean up the optimistic set then
    setTimeout(() => {
      setRemovedMemberIds((prev) => {
        const next = new Set(prev)
        next.delete(memberId)
        return next
      })
    }, 5000)
  }

  const handleSettle = async () => {
    if (!data) return
    if (!window.confirm('Mark this receipt as settled? This cannot be undone.')) return
    try {
      await settleReceipt(data.receipt.id)
      toast.success('Receipt settled!')
      refetch()
    } catch {
      toast.error('Failed to settle receipt')
    } 
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="size-8 border-2 border-ink-200 border-t-ink-700 rounded-full animate-spin" />
        <p className="text-sm text-ink-400 font-body">Loading receipt…</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="text-4xl">🧾</div>
        <h1 className="font-display text-2xl text-ink-900">Receipt not found</h1>
        <p className="text-sm text-ink-500 font-body">{error ?? 'This receipt does not exist.'}</p>
        <Link to="/new">
          <Button variant="primary">Create a new receipt</Button>
        </Link>
      </div>
    )
  }

  const { receipt, even_split } = data
  const isSettled = receipt.status === 'settled'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <ReceiptSummaryBar
        summary={{ ...data, members: visibleMembers }}
        isHost={isHost}
        onSettle={handleSettle}
      />

      {/* Host-only: split mode configuration */}
      {isHost && receipt.status === 'open' && (
        <SplitModePanel
          receipt={receipt}
          members={visibleMembers}
          onUpdate={refetch}
        />
      )}

      {/* Members section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-ink-900">
            People
            <span className="font-body text-sm text-ink-400 font-normal ml-2">
              {visibleMembers.length} / {receipt.people_count}
            </span>
          </h2>
          {!isSettled && (
            <Button variant="secondary" size="sm" onClick={() => setAddMemberOpen(true)}>
              + Join
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {visibleMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              receipt={receipt}
              evenSplit={even_split}
              isHost={isHost}
              onUpdate={refetch}
              onMemberRemoved={handleMemberRemoved}
            />
          ))}

          {visibleMembers.length === 0 && (
            <div className="text-center py-10 text-ink-400 font-body text-sm">
              No one has joined yet.
            </div>
          )}
        </div>
      </div>

      {isSettled && (
        <div className="bg-sage-50 border border-sage-200 rounded-2xl p-5 text-center">
          <p className="text-sm font-medium text-sage-700 font-body">
            This receipt has been settled ✓
          </p>
        </div>
      )}

      <AddMemberModal
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        receipt={receipt}
        existingMembers={visibleMembers}
        currentUserId={user?.id ?? null}
        onAdded={refetch}
      />
    </div>
  )
}
