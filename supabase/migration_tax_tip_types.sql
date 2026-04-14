-- ============================================================
-- Migration patch: tax/tip type and grand_total
-- ============================================================

alter table public.receipts
  add column if not exists tax_type   text not null default 'flat'
    check (tax_type in ('flat', 'percent')),
  add column if not exists tip_type   text not null default 'flat'
    check (tip_type in ('flat', 'percent')),
  add column if not exists grand_total numeric(10, 2) not null default 0;

-- Backfill grand_total for existing rows
update public.receipts
  set grand_total = total + tax + tip
  where grand_total = 0;
