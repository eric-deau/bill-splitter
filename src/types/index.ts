// ─── Database row types (mirror Supabase schema) ──────────────────────────────

export type ReceiptStatus = 'open' | 'settled' | 'expired'

export interface Receipt {
  id: string
  slug: string                   // short shareable ID in the URL
  name: string
  total: number                  // bill total in dollars
  tax: number                    // optional tax amount
  tip: number                    // optional tip amount
  etransfer_email: string
  etransfer_note: string | null
  people_count: number           // initial even-split denominator
  status: ReceiptStatus
  host_user_id: string | null    // null = guest receipt
  host_name: string
  expires_at: string | null      // ISO string; null = authenticated (no expiry)
  created_at: string
  updated_at: string
}

export interface Member {
  id: string
  receipt_id: string
  user_id: string | null         // null = anonymous member
  name: string
  color: MemberColor             // for avatar
  joined_at: string
}

export interface LineItem {
  id: string
  receipt_id: string
  member_id: string
  name: string
  price: number
  quantity: number
  created_at: string
}

// ─── View / computed types ─────────────────────────────────────────────────────

export interface MemberWithItems extends Member {
  items: LineItem[]
  subtotal: number
  // how much they owe: their subtotal, or even split if no items
  amount_due: number
}

export interface ReceiptSummary {
  receipt: Receipt
  members: MemberWithItems[]
  subtotal_assigned: number      // sum of all line items
  subtotal_unassigned: number    // receipt.total - assigned
  even_split: number             // receipt.total / people_count
  is_balanced: boolean           // unassigned < 0.01
}

// ─── Form types ────────────────────────────────────────────────────────────────

export interface CreateReceiptForm {
  name: string
  total: string
  tax: string
  tip: string
  etransfer_email: string
  etransfer_note: string
  people_count: string
  host_name: string
  save_account: boolean          // true = prompt sign-up after creation
}

export interface AddItemForm {
  name: string
  price: string
  quantity: string
}

export interface AddMemberForm {
  name: string
}

export interface AuthForm {
  email: string
  password: string
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string
  email: string | null
  is_anonymous: boolean
}

// ─── Realtime ──────────────────────────────────────────────────────────────────

export type RealtimeEvent = 'member_joined' | 'item_added' | 'item_removed' | 'receipt_settled'

export interface RealtimePayload<T = unknown> {
  event: RealtimeEvent
  receipt_id: string
  data: T
}

// ─── Misc ──────────────────────────────────────────────────────────────────────

export type MemberColor =
  | 'sage'
  | 'amber'
  | 'rose'
  | 'sky'
  | 'violet'
  | 'teal'
  | 'orange'
  | 'pink'

export const MEMBER_COLORS: MemberColor[] = [
  'sage', 'amber', 'rose', 'sky', 'violet', 'teal', 'orange', 'pink',
]

export const COLOR_MAP: Record<MemberColor, { bg: string; text: string; ring: string }> = {
  sage:   { bg: 'bg-sage-100',   text: 'text-sage-700',   ring: 'ring-sage-400'   },
  amber:  { bg: 'bg-amber-100',  text: 'text-amber-600',  ring: 'ring-amber-400'  },
  rose:   { bg: 'bg-rose-100',   text: 'text-rose-600',   ring: 'ring-rose-400'   },
  sky:    { bg: 'bg-sky-100',    text: 'text-sky-700',    ring: 'ring-sky-400'    },
  violet: { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-400' },
  teal:   { bg: 'bg-teal-100',   text: 'text-teal-700',   ring: 'ring-teal-400'   },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-400' },
  pink:   { bg: 'bg-pink-100',   text: 'text-pink-700',   ring: 'ring-pink-400'   },
}
