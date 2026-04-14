// ─── Database row types (mirror Supabase schema) ──────────────────────────────

export type ReceiptStatus = 'open' | 'settled' | 'expired'

// ─── Split modes ──────────────────────────────────────────────────────────────

/** How the bill total is divided among members */
export type SplitMode =
  | 'equal'       // total / member count — default
  | 'items'       // each person pays exactly what they ordered
  | 'percentage'  // host assigns a % per member (must sum to 100)
  | 'fixed'       // host sets a fixed dollar amount per member
  | 'shares'      // host assigns weight multipliers; total split proportionally

/** Per-member configuration stored in receipts.split_config (JSON) */
export interface SplitConfig {
  /** Keyed by member ID */
  overrides: Record<string, MemberSplitOverride>
}

export interface MemberSplitOverride {
  percentage?: number   // 0–100; used in 'percentage' mode
  fixed?: number        // dollar amount; used in 'fixed' mode
  shares?: number       // weight multiplier (default 1); used in 'shares' mode
}

export const SPLIT_MODE_LABELS: Record<SplitMode, string> = {
  equal:      'Equal split',
  items:      'By items',
  percentage: 'Percentage',
  fixed:      'Fixed amount',
  shares:     'Shares',
}

export const SPLIT_MODE_DESCRIPTIONS: Record<SplitMode, string> = {
  equal:      'Total divided evenly among all members',
  items:      'Each person pays only for what they ordered',
  percentage: 'Assign a percentage of the total to each person',
  fixed:      'Set a specific dollar amount per person',
  shares:     'Assign weighted shares — e.g. someone gets a double portion',
}

export type TaxTipType = 'flat' | 'percent'

export interface Receipt {
  id: string
  slug: string                   // short shareable ID in the URL
  name: string
  total: number                  // subtotal entered by host (before tax/tip)
  tax: number                    // tax amount in dollars (after resolving percent → flat)
  tax_type: TaxTipType           // whether tax was entered as flat $ or %
  tip: number                    // tip amount in dollars (after resolving percent → flat)
  tip_type: TaxTipType           // whether tip was entered as flat $ or %
  grand_total: number            // total + tax + tip — what members actually split
  etransfer_email: string
  etransfer_note: string | null
  people_count: number           // initial even-split denominator
  status: ReceiptStatus
  split_mode: SplitMode          // active split mode
  split_config: SplitConfig      // per-member overrides for non-equal modes
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
  subtotal: number        // sum of their line items
  amount_due: number      // what they actually owe under the active split mode
  split_label: string     // human-readable breakdown shown on card (e.g. "40%" or "2 shares")
}

export interface ReceiptSummary {
  receipt: Receipt
  members: MemberWithItems[]
  subtotal_assigned: number      // sum of all line items
  subtotal_unassigned: number    // receipt.total - sum of amount_due
  even_split: number             // receipt.total / member count (reference)
  is_balanced: boolean           // all amount_due sum within $0.01 of receipt.total
  split_remainder: number        // for 'percentage' and 'fixed': difference from total
}

// ─── Form types ────────────────────────────────────────────────────────────────

export interface CreateReceiptForm {
  name: string
  total: string
  tax: string
  tax_type: TaxTipType           // 'flat' | 'percent'
  tip: string
  tip_type: TaxTipType           // 'flat' | 'percent'
  etransfer_email: string
  etransfer_note: string
  people_count: string
  host_name: string
  save_account: boolean
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
