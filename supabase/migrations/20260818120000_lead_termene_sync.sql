-- Persist Termene company snapshots and weekly sync history

alter table public.leads
  add column if not exists termene_data jsonb,
  add column if not exists termene_synced_at timestamptz;

comment on column public.leads.termene_data is 'Latest Termene company profile (JSON snapshot)';
comment on column public.leads.termene_synced_at is 'When termene_data was last refreshed from Termene API';

create table if not exists public.lead_termene_snapshots (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  synced_at timestamptz not null default now(),
  data jsonb not null,
  changes jsonb not null default '[]'::jsonb,
  source text not null default 'manual' check (source in ('manual', 'cron'))
);

create index if not exists lead_termene_snapshots_lead_id_synced_at_idx
  on public.lead_termene_snapshots (lead_id, synced_at desc);

alter table public.lead_termene_snapshots enable row level security;

create policy "Portfolio users can view termene snapshots"
  on public.lead_termene_snapshots for select
  to authenticated
  using (public.has_permission('portfolio'));

-- Inserts/updates via service role (server actions + cron)
