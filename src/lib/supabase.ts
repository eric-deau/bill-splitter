import { createClient } from '@supabase/supabase-js'
import type { Receipt, Member, LineItem } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example → .env and fill in your project values.'
  )
}

// ─── Database type map for Supabase client ─────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      receipts: {
        Row: Receipt
        Insert: Omit<Receipt, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Receipt, 'id' | 'created_at'>>
      }
      members: {
        Row: Member
        Insert: Omit<Member, 'id' | 'joined_at'>
        Update: Partial<Omit<Member, 'id' | 'receipt_id'>>
      }
      line_items: {
        Row: LineItem
        Insert: Omit<LineItem, 'id' | 'created_at'>
        Update: Partial<Omit<LineItem, 'id' | 'receipt_id' | 'member_id'>>
      }
    }
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
