-- Leads from website form + sales assignment

create type public.lead_status as enum ('new', 'contacted', 'qualified', 'won', 'lost');

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status public.lead_status not null default 'new',
  source text not null default 'website',
  name text not null,
  email text not null,
  phone text,
  company text,
  message text,
  form_payload jsonb not null default '{}'::jsonb,
  external_id text unique,
  assigned_to uuid references public.profiles (id) on delete set null,
  notes text
);

create index leads_status_idx on public.leads (status);
create index leads_assigned_to_idx on public.leads (assigned_to);
create index leads_created_at_idx on public.leads (created_at desc);
create index leads_email_idx on public.leads (email);

alter table public.leads enable row level security;

create or replace function public.has_permission(permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
  or coalesce(
    (
      select (permissions ->> permission_key)::boolean
      from public.profiles
      where id = auth.uid()
    ),
    false
  )
  or exists (
    select 1
    from public.user_role_assignments ura
    join public.app_roles ar on ar.id = ura.role_id
    where ura.user_id = auth.uid()
      and coalesce((ar.permissions ->> permission_key)::boolean, false)
  );
$$;

revoke all on function public.has_permission(text) from public;
grant execute on function public.has_permission(text) to authenticated;

create policy "Users can view leads"
  on public.leads for select
  to authenticated
  using (
    public.has_permission('clients_view_all')
    or assigned_to = auth.uid()
    or assigned_to is null
  );

create policy "Managers can insert leads"
  on public.leads for insert
  to authenticated
  with check (public.has_permission('clients_manage'));

create policy "Users can update leads"
  on public.leads for update
  to authenticated
  using (
    public.has_permission('clients_manage')
    or assigned_to = auth.uid()
  )
  with check (
    public.has_permission('clients_manage')
    or assigned_to = auth.uid()
  );

create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();
