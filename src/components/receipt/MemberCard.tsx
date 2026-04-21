import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Input, FormField } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { toast } from '@/components/ui/Toast'
import { addLineItem, removeLineItem, removeMember } from '@/lib/api'
import { formatCurrency, cn } from '@/lib/utils'
import type { MemberWithItems, Receipt, AddItemForm } from '@/types'

interface MemberCardProps {
  member: MemberWithItems
  receipt: Receipt
  evenSplit: number
  isHost: boolean
  onUpdate: () => void
  onMemberRemoved: (memberId: string) => void
}

const EMPTY_ITEM: AddItemForm = { name: '', price: '', quantity: '1' }

export function MemberCard({
  member,
  receipt,
  isHost,
  onUpdate,
  onMemberRemoved,
}: MemberCardProps) {
  const [showAddItem, setShowAddItem] = useState(false)
  const [form, setForm] = useState<AddItemForm>(EMPTY_ITEM)
  const [formErrors, setFormErrors] = useState<Partial<AddItemForm>>({})
  const [submitting, setSubmitting] = useState(false)
  const [removingItem, setRemovingItem] = useState<string | null>(null)
  const [removingMember, setRemovingMember] = useState(false)
  const [confirmRemoveMember, setConfirmRemoveMember] = useState(false)

  const isSettled = receipt.status === 'settled'
  const splitMode = receipt.split_mode ?? 'equal'
  // In 'items' mode show the item subtotal; otherwise show the computed amount_due
  const displayDue = member.amount_due
  const showItemsSubtotal = splitMode === 'items'

  const set = (field: keyof AddItemForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setFormErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleAddItem = async () => {
    const errors: Partial<AddItemForm> = {}
    if (!form.name.trim()) errors.name = 'Item name required'
    const price = parseFloat(form.price)
    if (!form.price || isNaN(price) || price < 0 || price >= receipt.grand_total || (price * Number(form.quantity)) > receipt.grand_total) errors.price = 'Valid price required'
    if (Object.keys(errors).length) { setFormErrors(errors); return }

    setSubmitting(true)
    try {
      await addLineItem(receipt.id, member.id, form)
      setForm(EMPTY_ITEM)
      setShowAddItem(false)
      onUpdate()
      toast.success(`Added "${form.name.trim()}"`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add item')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemoveItem = async (itemId: string, itemName: string) => {
    setRemovingItem(itemId)
    try {
      await removeLineItem(itemId)
      onUpdate()
      toast.success(`Removed "${itemName}"`)
    } catch {
      toast.error('Failed to remove item')
    } finally {
      setRemovingItem(null)
    }
  }

  const handleRemoveMember = async () => {
    setRemovingMember(true)
    try {
      await removeMember(member.id)
      toast.success(`Removed ${member.name}`)
      onMemberRemoved(member.id)
    } catch {
      toast.error('Failed to remove member')
      setRemovingMember(false)
      setConfirmRemoveMember(false)
    }
  }

  return (
    <div className={cn(
      'bg-white border rounded-2xl shadow-soft overflow-hidden transition-all duration-200',
      removingMember ? 'opacity-50 scale-[0.99] border-rose-200' : 'border-ink-100'
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-ink-100">
        <Avatar name={member.name} color={member.color} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-body font-medium text-ink-900 text-sm truncate">
              {member.name}
            </span>
            {member.is_host && <Badge variant="success">Host</Badge>}
          </div>
          <p className="text-xs text-ink-400 font-body mt-0.5">
            {member.split_label || 'no items'}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-mono font-medium text-ink-900 text-sm">
            {formatCurrency(displayDue)}
          </p>
          {showItemsSubtotal && member.subtotal !== displayDue && (
            <p className="text-xs text-ink-400 font-body">items: {formatCurrency(member.subtotal)}</p>
          )}
        </div>

        {/* Host-only: remove member button — never shown for the host themselves */}
        {isHost && !member.is_host && !isSettled && (
          <div className="shrink-0 ml-1">
            {confirmRemoveMember ? (
              <div className="flex items-center gap-1.5 animate-fade-in">
                <span className="text-xs text-ink-500 font-body whitespace-nowrap">Remove?</span>
                <button
                  onClick={handleRemoveMember}
                  disabled={removingMember}
                  className="text-xs font-medium text-rose-600 hover:text-rose-700 font-body disabled:opacity-50 transition-colors"
                >
                  {removingMember ? (
                    <span className="size-3 border border-rose-500 border-t-transparent rounded-full animate-spin inline-block" />
                  ) : 'Yes'}
                </button>
                <span className="text-ink-200 text-xs">·</span>
                <button
                  onClick={() => setConfirmRemoveMember(false)}
                  className="text-xs text-ink-400 hover:text-ink-600 font-body transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmRemoveMember(true)}
                className={cn(
                  'size-7 flex items-center justify-center rounded-lg transition-colors',
                  'text-ink-200 hover:text-rose-500 hover:bg-rose-50'
                )}
                title={`Remove ${member.name}`}
              >
                <RemovePersonIcon />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="px-5">
        {member.items.length === 0 ? (
          <p className="text-xs text-ink-400 font-body py-3 italic">No items added yet</p>
        ) : (
          <ul className="divide-y divide-ink-50">
            {member.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-2.5 group/item">
                <span className="flex-1 text-sm text-ink-700 font-body truncate">
                  {item.name}
                  {item.quantity > 1 && (
                    <span className="text-ink-400 ml-1.5">×{item.quantity}</span>
                  )}
                </span>
                <span className="font-mono text-sm text-ink-800 shrink-0">
                  {formatCurrency(item.price * item.quantity)}
                </span>

                {/* Host-only: remove item button */}
                {isHost && !isSettled && (
                  <button
                    onClick={() => handleRemoveItem(item.id, item.name)}
                    disabled={removingItem === item.id}
                    className={cn(
                      'size-5 flex items-center justify-center rounded transition-colors shrink-0',
                      'text-ink-200 hover:text-rose-500 disabled:opacity-50',
                      // fade in on row hover for a cleaner look
                      'opacity-0 group-hover/item:opacity-100'
                    )}
                    title={`Remove "${item.name}"`}
                  >
                    {removingItem === item.id ? (
                      <span className="size-3 border border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-base leading-none">×</span>
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Add item inline form */}
        {showAddItem && (
          <div className="border-t border-ink-100 py-4 space-y-3 animate-fade-up">
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-3">
                <FormField label="Item" htmlFor={`item-name-${member.id}`}>
                  <Input
                    id={`item-name-${member.id}`}
                    placeholder="Salmon roll"
                    value={form.name}
                    onChange={set('name')}
                    error={formErrors.name}
                    autoFocus
                  />
                </FormField>
              </div>
              <div className="col-span-1">
                <FormField label="Price" htmlFor={`item-price-${member.id}`}>
                  <Input
                    id={`item-price-${member.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    prefix="$"
                    value={form.price}
                    onChange={set('price')}
                    error={formErrors.price}
                  />
                </FormField>
              </div>
              <div className="col-span-1">
                <FormField label="Qty" htmlFor={`item-qty-${member.id}`}>
                  <Input
                    id={`item-qty-${member.id}`}
                    type="number"
                    min="1"
                    step="1"
                    placeholder="1"
                    value={form.quantity}
                    onChange={set('quantity')}
                  />
                </FormField>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" loading={submitting} onClick={handleAddItem}>
                Add item
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setShowAddItem(false); setForm(EMPTY_ITEM) }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer: add item (available to everyone on open receipts) */}
      {!showAddItem && !isSettled && (
        <div className="px-5 py-3 border-t border-ink-50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddItem(true)}
            className="text-sage-600 hover:text-sage-700 hover:bg-sage-50 -ml-2"
          >
            + Add item
          </Button>
        </div>
      )}
    </div>
  )
}

// Small SVG icon: person with an X — cleaner than a text character for this action
function RemovePersonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="6" cy="4.5" r="2.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M1 13c0-2.761 2.239-5 5-5h1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M10.5 10L13 12.5M13 10L10.5 12.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}
