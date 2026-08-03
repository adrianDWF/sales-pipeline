-- Leads pipeline v2: 9-stage status, profile fields, related tables

create type public.lead_priority as enum ('low', 'medium', 'high');

create type public.lead_status_v2 as enum (
  'new_lead',
  'first_contact',
  'open_dialog',
  'proposal_prep',
  'proposal_presented',
  'negotiation',
  'contract_signing',
  'finalized',
  'lost'
);

alter table public.leads
  alter column status drop default;

alter table public.leads
  alter column status type public.lead_status_v2
  using (
    case status::text
      when 'new' then 'new_lead'
      when 'contacted' then 'first_contact'
      when 'qualified' then 'negotiation'
      when 'won' then 'finalized'
      when 'lost' then 'lost'
      else 'new_lead'
    end
  )::public.lead_status_v2;

alter table public.leads
  alter column status set default 'new_lead';

drop type public.lead_status;

alter type public.lead_status_v2 rename to lead_status;

alter table public.leads
  add column if not exists website_url text,
  add column if not exists cui text,
  add column if not exists priority public.lead_priority not null default 'medium',
  add column if not exists deal_value numeric(12, 2),
  add column if not exists deal_currency text not null default 'EUR';

-- Child tables
create table public.lead_services (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  service_name text not null,
  budget_amount numeric(12, 2),
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lead_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  stage public.lead_status not null,
  title text not null,
  completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lead_meetings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  title text not null,
  scheduled_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lead_offers (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  title text not null,
  amount numeric(12, 2),
  currency text not null default 'EUR',
  status text not null default 'draft',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lead_legal (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  title text not null,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lead_services_lead_id_idx on public.lead_services (lead_id);
create index lead_tasks_lead_id_idx on public.lead_tasks (lead_id);
create index lead_tasks_stage_idx on public.lead_tasks (lead_id, stage);
create index lead_notes_lead_id_idx on public.lead_notes (lead_id);
create index lead_meetings_lead_id_idx on public.lead_meetings (lead_id);
create index lead_offers_lead_id_idx on public.lead_offers (lead_id);
create index lead_legal_lead_id_idx on public.lead_legal (lead_id);

create trigger lead_services_updated_at
  before update on public.lead_services
  for each row execute function public.set_updated_at();

create trigger lead_tasks_updated_at
  before update on public.lead_tasks
  for each row execute function public.set_updated_at();

create trigger lead_notes_updated_at
  before update on public.lead_notes
  for each row execute function public.set_updated_at();

create trigger lead_meetings_updated_at
  before update on public.lead_meetings
  for each row execute function public.set_updated_at();

create trigger lead_offers_updated_at
  before update on public.lead_offers
  for each row execute function public.set_updated_at();

create trigger lead_legal_updated_at
  before update on public.lead_legal
  for each row execute function public.set_updated_at();

-- RLS helper: can current user see this lead?
create or replace function public.can_view_lead(target_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.leads l
    where l.id = target_lead_id
      and (
        public.has_permission('clients_view_all')
        or l.assigned_to = auth.uid()
        or l.assigned_to is null
      )
  );
$$;

revoke all on function public.can_view_lead(uuid) from public;
grant execute on function public.can_view_lead(uuid) to authenticated;

create or replace function public.can_edit_lead(target_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.leads l
    where l.id = target_lead_id
      and (
        public.has_permission('clients_manage')
        or l.assigned_to = auth.uid()
      )
  );
$$;

revoke all on function public.can_edit_lead(uuid) from public;
grant execute on function public.can_edit_lead(uuid) to authenticated;

alter table public.lead_services enable row level security;
alter table public.lead_tasks enable row level security;
alter table public.lead_notes enable row level security;
alter table public.lead_meetings enable row level security;
alter table public.lead_offers enable row level security;
alter table public.lead_legal enable row level security;

-- lead_services policies
create policy "View lead services"
  on public.lead_services for select to authenticated
  using (public.can_view_lead(lead_id));

create policy "Edit lead services"
  on public.lead_services for all to authenticated
  using (public.can_edit_lead(lead_id))
  with check (public.can_edit_lead(lead_id));

-- lead_tasks policies
create policy "View lead tasks"
  on public.lead_tasks for select to authenticated
  using (public.can_view_lead(lead_id));

create policy "Edit lead tasks"
  on public.lead_tasks for all to authenticated
  using (public.can_edit_lead(lead_id))
  with check (public.can_edit_lead(lead_id));

-- lead_notes policies
create policy "View lead notes"
  on public.lead_notes for select to authenticated
  using (public.can_view_lead(lead_id));

create policy "Edit lead notes"
  on public.lead_notes for all to authenticated
  using (public.can_edit_lead(lead_id))
  with check (public.can_edit_lead(lead_id));

-- lead_meetings policies
create policy "View lead meetings"
  on public.lead_meetings for select to authenticated
  using (public.can_view_lead(lead_id));

create policy "Edit lead meetings"
  on public.lead_meetings for all to authenticated
  using (public.can_edit_lead(lead_id))
  with check (public.can_edit_lead(lead_id));

-- lead_offers policies
create policy "View lead offers"
  on public.lead_offers for select to authenticated
  using (public.can_view_lead(lead_id));

create policy "Edit lead offers"
  on public.lead_offers for all to authenticated
  using (public.can_edit_lead(lead_id))
  with check (public.can_edit_lead(lead_id));

-- lead_legal policies
create policy "View lead legal"
  on public.lead_legal for select to authenticated
  using (public.can_view_lead(lead_id));

create policy "Edit lead legal"
  on public.lead_legal for all to authenticated
  using (public.can_edit_lead(lead_id))
  with check (public.can_edit_lead(lead_id));

-- Allow reps to insert leads they will own (manual add claims unassigned)
create policy "Reps can insert unassigned leads"
  on public.leads for insert
  to authenticated
  with check (
    public.has_permission('clients_manage')
    or assigned_to is null
    or assigned_to = auth.uid()
  );
