-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── receipts ─────────────────────────────────────────────────────────────────

create table if not exists public.receipts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,          -- short URL-safe ID (e.g. "abc12xyz")
  name            text not null,
  total           numeric(10, 2) not null,
  tax             numeric(10, 2) not null default 0,
  tip             numeric(10, 2) not null default 0,
  etransfer_email text not null,
  etransfer_note  text,
  people_count    integer not null default 2,
  status          text not null default 'open' check (status in ('open', 'settled', 'expired')),
  host_user_id    uuid references auth.users(id) on delete set null,
  host_name       text not null,
  expires_at      timestamptz,                   -- null = authenticated host, no expiry
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── members ──────────────────────────────────────────────────────────────────

create table if not exists public.members (
  id          uuid primary key default gen_random_uuid(),
  receipt_id  uuid not null references public.receipts(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null,
  name        text not null,
  color       text not null default 'sage',
  joined_at   timestamptz not null default now()
);

-- ─── line_items ───────────────────────────────────────────────────────────────

create table if not exists public.line_items (
  id          uuid primary key default gen_random_uuid(),
  receipt_id  uuid not null references public.receipts(id) on delete cascade,
  member_id   uuid not null references public.members(id) on delete cascade,
  name        text not null,
  price       numeric(10, 2) not null,
  quantity    integer not null default 1,
  created_at  timestamptz not null default now()
);

-- ─── indexes ──────────────────────────────────────────────────────────────────

create index if not exists receipts_slug_idx        on public.receipts(slug);
create index if not exists receipts_host_user_idx   on public.receipts(host_user_id);
create index if not exists receipts_expires_idx     on public.receipts(expires_at);
create index if not exists members_receipt_idx      on public.members(receipt_id);
create index if not exists line_items_receipt_idx   on public.line_items(receipt_id);
create index if not exists line_items_member_idx    on public.line_items(member_id);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_receipts_updated_at on public.receipts;
create trigger set_receipts_updated_at
  before update on public.receipts
  for each row execute function public.handle_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table public.receipts  enable row level security;
alter table public.members   enable row level security;
alter table public.line_items enable row level security;

-- receipts: anyone can read by slug (for sharing); only host or anon creator can update
create policy "receipts_read_by_slug"
  on public.receipts for select
  using (true);

create policy "receipts_insert_any"
  on public.receipts for insert
  with check (true);

create policy "receipts_update_by_host"
  on public.receipts for update
  using (
    host_user_id = auth.uid()
    or host_user_id is null  -- guest receipts can be updated by anyone with the link
  );

-- members: anyone on the receipt can read; anyone can join a receipt
create policy "members_read"
  on public.members for select
  using (true);

create policy "members_insert"
  on public.members for insert
  with check (true);

create policy "members_delete_own"
  on public.members for delete
  using (user_id = auth.uid() or user_id is null);

-- line_items: readable by all; insertable/deletable by the member
create policy "items_read"
  on public.line_items for select
  using (true);

create policy "items_insert"
  on public.line_items for insert
  with check (true);

create policy "items_delete"
  on public.line_items for delete
  using (true);

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Enable realtime for all three tables in your Supabase dashboard:
-- Database → Replication → select receipts, members, line_items

-- ─── Cron: expire guest receipts after 24h ────────────────────────────────────
-- (Enable pg_cron extension in Supabase Dashboard → Extensions first)
-- select cron.schedule(
--   'expire-guest-receipts',
--   '0 * * * *',  -- every hour
--   $$
--     update public.receipts
--     set status = 'expired'
--     where expires_at < now()
--       and status = 'open';
--   $$
-- );
