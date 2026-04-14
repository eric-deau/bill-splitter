import { supabase } from '@/lib/supabase'
import type {
  Receipt,
  Member,
  LineItem,
  CreateReceiptForm,
  AddItemForm,
  AddMemberForm,
  MemberWithItems,
  ReceiptSummary,
  MemberColor,
  MEMBER_COLORS,
} from '@/types'
import { MEMBER_COLORS as COLORS } from '@/types'
import { nanoid } from 'nanoid'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickColor(index: number): MemberColor {
  return COLORS[index % COLORS.length]
}

function buildSummary(receipt: Receipt, members: Member[], items: LineItem[]): ReceiptSummary {
  const evenSplit = receipt.total / receipt.people_count

  const membersWithItems: MemberWithItems[] = members.map((m) => {
    const memberItems = items.filter((it) => it.member_id === m.id)
    const subtotal = memberItems.reduce((sum, it) => sum + it.price * it.quantity, 0)
    return {
      ...m,
      items: memberItems,
      subtotal,
      amount_due: subtotal,
    }
  })

  const subtotalAssigned = membersWithItems.reduce((s, m) => s + m.subtotal, 0)
  const subtotalUnassigned = Math.max(0, receipt.total - subtotalAssigned)

  return {
    receipt,
    members: membersWithItems,
    subtotal_assigned: subtotalAssigned,
    subtotal_unassigned: subtotalUnassigned,
    even_split: evenSplit,
    is_balanced: subtotalUnassigned < 0.01,
  }
}

// ─── Receipts ─────────────────────────────────────────────────────────────────

export async function createReceipt(
  form: CreateReceiptForm,
  hostUserId: string | null
): Promise<Receipt> {
  const total = parseFloat(form.total) || 0
  const tax = parseFloat(form.tax) || 0
  const tip = parseFloat(form.tip) || 0
  const peopleCount = parseInt(form.people_count) || 2
  const isGuest = hostUserId === null

  const slug = nanoid(8)
  const expiresAt = isGuest
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    : null

  const { data, error } = await supabase
    .from('receipts')
    .insert({
      slug,
      name: form.name.trim(),
      total,
      tax,
      tip,
      etransfer_email: form.etransfer_email.trim(),
      etransfer_note: form.etransfer_note.trim() || null,
      people_count: peopleCount,
      status: 'open',
      host_user_id: hostUserId,
      host_name: form.host_name.trim(),
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('No receipt returned')

  // Auto-add host as first member
  await addMember(data.id, { name: form.host_name.trim() }, hostUserId, 0)

  return data
}

export async function getReceiptBySlug(slug: string): Promise<ReceiptSummary | null> {
  const { data: receipt, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !receipt) return null

  const [{ data: members }, { data: items }] = await Promise.all([
    supabase.from('members').select('*').eq('receipt_id', receipt.id).order('joined_at'),
    supabase.from('line_items').select('*').eq('receipt_id', receipt.id).order('created_at'),
  ])

  return buildSummary(receipt, members ?? [], items ?? [])
}

export async function getReceiptsByUser(userId: string): Promise<Receipt[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('host_user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function settleReceipt(receiptId: string): Promise<void> {
  const { error } = await supabase
    .from('receipts')
    .update({ status: 'settled' })
    .eq('id', receiptId)

  if (error) throw new Error(error.message)
}

// ─── Members ──────────────────────────────────────────────────────────────────

export async function addMember(
  receiptId: string,
  form: AddMemberForm,
  userId: string | null,
  existingMemberCount: number
): Promise<Member> {
  const { data, error } = await supabase
    .from('members')
    .insert({
      receipt_id: receiptId,
      user_id: userId,
      name: form.name.trim(),
      color: pickColor(existingMemberCount),
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('No member returned')
  return data
}

export async function removeMember(memberId: string): Promise<void> {
  // Cascade deletes line_items automatically via FK
  const { error } = await supabase.from('members').delete().eq('id', memberId)
  if (error) throw new Error(error.message)
}

// ─── Line Items ───────────────────────────────────────────────────────────────

export async function addLineItem(
  receiptId: string,
  memberId: string,
  form: AddItemForm
): Promise<LineItem> {
  const price = parseFloat(form.price) || 0
  const quantity = parseInt(form.quantity) || 1

  const { data, error } = await supabase
    .from('line_items')
    .insert({
      receipt_id: receiptId,
      member_id: memberId,
      name: form.name.trim(),
      price,
      quantity,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error('No item returned')
  return data
}

export async function removeLineItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('line_items').delete().eq('id', itemId)
  if (error) throw new Error(error.message)
}

// ─── Realtime subscription ────────────────────────────────────────────────────

export function subscribeToReceipt(
  receiptId: string,
  onUpdate: () => void
) {
  const channel = supabase
    .channel(`receipt:${receiptId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'members', filter: `receipt_id=eq.${receiptId}` },
      onUpdate
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'line_items', filter: `receipt_id=eq.${receiptId}` },
      onUpdate
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'receipts', filter: `id=eq.${receiptId}` },
      onUpdate
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}
