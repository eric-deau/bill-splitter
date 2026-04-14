-- ============================================================
-- Migration patch: add split mode support
-- ============================================================

alter table public.receipts
  add column if not exists split_mode text not null default 'equal'
    check (split_mode in ('equal', 'items', 'percentage', 'fixed', 'shares')),
  add column if not exists split_config jsonb not null default '{"overrides": {}}'::jsonb;

-- Backfill existing rows (safe — sets sensible defaults)
update public.receipts
  set split_mode = 'equal',
      split_config = '{"overrides": {}}'::jsonb
  where split_mode is null or split_config is null;
