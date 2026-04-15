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

# Supabase: password reset setup

After deploying, add your site URL to the Supabase redirect allow-list so the
password reset email link works correctly.

1. Supabase Dashboard → Authentication → URL Configuration
2. Under "Redirect URLs", add:
   - http://localhost:5173/auth/reset-password (local dev)
   - https://yourdomain.com/auth/reset-password (production)

Without this, Supabase will reject the redirect and the reset link won't land
on your app's reset page.

# Supabase: OAuth provider setup

OAuth requires manual configuration in the Supabase dashboard plus
credentials from each provider. Steps below for Google and GitHub.

---

## 1. Add redirect URL to Supabase

Dashboard → Authentication → URL Configuration → Redirect URLs

Add:
http://localhost:5173/auth/callback ← local dev
https://yourdomain.com/auth/callback ← production

---

## 2. Google OAuth

### In Google Cloud Console (console.cloud.google.com):

1. Create a project (or use an existing one)
2. APIs & Services → OAuth consent screen → configure (External, add your domain)
3. APIs & Services → Credentials → Create credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Authorised redirect URIs: https://<your-supabase-project>.supabase.co/auth/v1/callback
4. Copy the Client ID and Client Secret

### In Supabase:

Dashboard → Authentication → Providers → Google

- Enable Google
- Paste Client ID and Client Secret
- Save

---

## 3. GitHub OAuth

### In GitHub (github.com/settings/developers):

1. OAuth Apps → New OAuth App
   - Homepage URL: http://localhost:5173 (update for production)
   - Authorization callback URL: https://<your-supabase-project>.supabase.co/auth/v1/callback
2. Generate a new client secret
3. Copy the Client ID and Client Secret

### In Supabase:

Dashboard → Authentication → Providers → GitHub

- Enable GitHub
- Paste Client ID and Client Secret
- Save

---

## 4. Verify

After setup, clicking "Google" or "GitHub" on the login page should open
the provider's consent screen and redirect back to /auth/callback, which
exchanges the code for a session and lands on /dashboard.

## Next Steps

- [x] Host-only delete controls for members/items
- [x] Unequal split modes (percentage, custom amounts)
- [ ] Receipt export to PDF
- [ ] Push notifications when someone joins
- [ ] Upgrade guest receipt to account post-creation
- [ ] Account settings for changing email, password
- [ ] Cookie sessions

## To Fix

- [x] More members than defined limit can join
- [x] Can't add items more than the total amount on the bill

## TODO

- [x] Add logic for when users add items in equal split mode, adjust the costs of what other users owe
