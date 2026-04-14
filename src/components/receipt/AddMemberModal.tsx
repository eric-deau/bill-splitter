import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, FormField } from '@/components/ui/Input'
import { toast } from '@/components/ui/Toast'
import { addMember } from '@/lib/api'
import type { Receipt, MemberWithItems } from '@/types'

interface AddMemberModalProps {
  open: boolean
  onClose: () => void
  receipt: Receipt
  existingMembers: MemberWithItems[]
  currentUserId: string | null
  onAdded: () => void
}

export function AddMemberModal({
  open,
  onClose,
  receipt,
  existingMembers,
  currentUserId,
  onAdded,
}: AddMemberModalProps) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const trimmed = name.trim()
    if (!trimmed) { setError('Name is required'); return }
    if (existingMembers.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('That name is already in this receipt')
      return
    }
    setSubmitting(true)
    try {
      await addMember(
        receipt.id,
        { name: trimmed },
        currentUserId,
        existingMembers.length
      )
      toast.success(`${trimmed} joined the receipt!`)
      onAdded()
      onClose()
      setName('')
      setError('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to join')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Join this receipt">
      <div className="space-y-5">
        <p className="text-sm text-ink-500 font-body">
          Add your name to start tracking what you ordered.
        </p>

        <FormField label="Your name" htmlFor="member-name">
          <Input
            id="member-name"
            placeholder="Your name"
            value={name}
            onChange={(e) => { setName(e.target.value); setError('') }}
            error={error}
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </FormField>

        <div className="flex gap-3">
          <Button variant="primary" loading={submitting} onClick={handleSubmit} className="flex-1">
            Join
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}
