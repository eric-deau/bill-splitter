# IOU — Bill Splitter

A real-time, multi-tenant bill splitting app built with React, TypeScript, and Supabase.

## Tech Stack

| Layer         | Choice                                |
| ------------- | ------------------------------------- |
| Frontend      | React 18 + TypeScript + Vite          |
| Styling       | Tailwind CSS (custom design system)   |
| Routing       | React Router v6                       |
| Data fetching | TanStack Query v5                     |
| Backend       | Supabase (Postgres + Auth + Realtime) |
| ID generation | nanoid                                |

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   └── Layout.tsx          # App shell, nav bar
│   ├── receipt/
│   │   ├── CreateReceiptForm.tsx   # 3-step host creation flow
│   │   ├── MemberCard.tsx          # Per-person card + add item form
│   │   ├── ReceiptSummaryBar.tsx   # Summary, progress, share link
│   │   └── AddMemberModal.tsx      # Join a receipt modal
│   └── ui/
│       ├── Avatar.tsx
│       ├── Badge.tsx
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx           # Input + Label + FormField
│       ├── Modal.tsx
│       └── Toast.tsx           # Global toast system
├── hooks/
│   ├── useAuth.tsx             # Auth context + hook
│   └── useReceipt.ts           # Load receipt + Realtime subscription
├── lib/
│   ├── api.ts                  # All Supabase data access functions
│   ├── supabase.ts             # Supabase client singleton
│   └── utils.ts                # cn(), formatCurrency(), etc.
├── pages/
│   ├── LandingPage.tsx
│   ├── NewReceiptPage.tsx
│   ├── ReceiptPage.tsx         # Live receipt view
│   ├── AuthPage.tsx            # Login + signup
│   └── DashboardPage.tsx       # Host's receipt list
├── types/
│   └── index.ts                # All TypeScript types
├── App.tsx                     # Router + providers
└── main.tsx
supabase/
└── migration.sql               # Full DB schema + RLS policies
```

## Getting Started

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, and note your **Project URL** and **anon public key**.

### 2. Run the migration

In your Supabase dashboard, go to **SQL Editor** and paste + run the contents of `supabase/migration.sql`.

Then enable **Realtime** for the three tables:

- Go to **Database → Replication**
- Toggle on `receipts`, `members`, and `line_items`

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Install and run

```bash
npm install
npm run dev
```

## Key Design Decisions

### Guest vs Authenticated receipts

|                    | Guest            | Authenticated    |
| ------------------ | ---------------- | ---------------- |
| Requires sign-up   | No               | Yes              |
| Expires            | 24 hours         | Never            |
| Saved to dashboard | No               | Yes              |
| Receipt editable   | Anyone with link | Anyone with link |

The `expires_at` column is `null` for authenticated receipts and a 24-hour timestamp for guest ones. A Supabase cron job (commented out in migration.sql) marks them `expired` hourly.

### Multi-tenancy

Each receipt is a completely independent instance identified by an 8-character nanoid `slug` (e.g. `/r/abc12xyz`). Hosts can own many receipts via `host_user_id`. Guest receipts have `host_user_id = null`.

### Realtime

`useReceipt.ts` subscribes to Postgres changes on `members` and `line_items` filtered by `receipt_id`. Any insert/update/delete triggers a full re-fetch, keeping all clients in sync.

### Row Level Security

- Anyone can **read** all tables (needed for link sharing)
- Anyone can **insert** members and items (open collaboration)
- Only the host (matched by `auth.uid()`) can **update** the receipt itself
- Guest receipts (`host_user_id IS NULL`) can be updated by anyone

## Next Steps

- [ ] Host-only delete controls for members/items
- [ ] Unequal split modes (percentage, custom amounts)
- [ ] Receipt export to PDF
- [ ] Push notifications when someone joins
- [ ] Upgrade guest receipt to account post-creation
