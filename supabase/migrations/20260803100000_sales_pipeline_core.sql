-- Sales Pipeline core schema: auth profiles, roles, approval, audit, oauth state

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type public.user_role as enum ('admin', 'manager', 'staff');
create type public.approval_status as enum ('pending', 'approved', 'rejected', 'pending_on_hold');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  role public.user_role not null default 'staff',
  permissions jsonb not null default '{}'::jsonb,
  is_system_admin boolean not null default false,
  approval_status public.approval_status not null default 'pending',
  approval_reviewed_at timestamptz,
  approval_reviewed_by uuid references auth.users (id) on delete set null,
  preferred_locale text not null default 'ro' check (preferred_locale in ('ro', 'en')),
  preferred_currency text not null default 'RON',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create table public.app_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  permissions jsonb not null default '{}'::jsonb,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role_id uuid not null references public.app_roles (id) on delete cascade,
  assigned_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, role_id)
);

create index user_role_assignments_user_id_idx on public.user_role_assignments (user_id);
create index user_role_assignments_role_id_idx on public.user_role_assignments (role_id);

insert into public.app_roles (name, slug, description, permissions, is_system)
values
  (
    'Super Admin',
    'super-admin',
    'Full workspace access including member and role management.',
    jsonb_build_object('dashboard', true, 'portfolio', true, 'admin', true),
    true
  ),
  (
    'Sales Manager',
    'sales-manager',
    'View all leads and manage assignments.',
    jsonb_build_object('dashboard', true, 'portfolio', true, 'clients_view_all', true, 'clients_manage', true, 'admin', false),
    true
  ),
  (
    'Sales Rep',
    'sales-rep',
    'Work assigned leads day to day.',
    jsonb_build_object('dashboard', true, 'portfolio', true, 'admin', false),
    true
  )
on conflict (slug) do nothing;

create table public.email_monthly_usage (
  month_key text primary key,
  send_count integer not null default 0 check (send_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.email_monthly_usage enable row level security;

create table public.oauth_states (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('google', 'meta', 'tiktok')),
  service text not null,
  state_nonce text not null,
  redirect_path text not null default '/integrations',
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index oauth_states_user_id_idx on public.oauth_states (user_id);
create index oauth_states_expires_at_idx on public.oauth_states (expires_at);

alter table public.oauth_states enable row level security;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index audit_logs_user_id_idx on public.audit_logs (user_id);
create index audit_logs_action_idx on public.audit_logs (action);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and is_system_admin = true
  )
  or exists (
    select 1
    from public.user_role_assignments ura
    join public.app_roles ar on ar.id = ura.role_id
    where ura.user_id = auth.uid()
      and coalesce((ar.permissions ->> 'admin')::boolean, false) = true
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create policy "Users can view own profile"
  on public.profiles for select
  using (public.is_admin() or auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (public.is_admin() or auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin() or auth.uid() = id);

create policy "Authenticated users can read roles"
  on public.app_roles for select
  to authenticated
  using (true);

create policy "Admins can insert roles"
  on public.app_roles for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update roles"
  on public.app_roles for update
  to authenticated
  using (public.is_admin());

create policy "Admins can delete non-system roles"
  on public.app_roles for delete
  to authenticated
  using (public.is_admin() and is_system = false);

create policy "Users can view own role assignments"
  on public.user_role_assignments for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Admins can insert role assignments"
  on public.user_role_assignments for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can delete role assignments"
  on public.user_role_assignments for delete
  to authenticated
  using (public.is_admin());

create policy "Admins can read email usage"
  on public.email_monthly_usage for select
  to authenticated
  using (public.is_admin());

create policy "Admins can read audit logs"
  on public.audit_logs for select
  to authenticated
  using (public.is_admin());

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger app_roles_updated_at
  before update on public.app_roles
  for each row execute function public.set_updated_at();

create or replace function public.get_email_send_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select send_count
      from public.email_monthly_usage
      where month_key = to_char(timezone('utc', now()), 'YYYY-MM')
    ),
    0
  );
$$;

create or replace function public.increment_email_send()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_month text := to_char(timezone('utc', now()), 'YYYY-MM');
  new_count integer;
begin
  insert into public.email_monthly_usage (month_key, send_count)
  values (current_month, 1)
  on conflict (month_key) do update
  set send_count = public.email_monthly_usage.send_count + 1, updated_at = now()
  returning send_count into new_count;

  return new_count;
end;
$$;

revoke all on function public.get_email_send_count() from public;
revoke all on function public.increment_email_send() from public;
grant execute on function public.get_email_send_count() to authenticated;
grant execute on function public.increment_email_send() to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  assigned_role_id uuid;
  is_bootstrap_admin boolean := new.email = 'adrian@dwf.ro';
  email_limit integer := 3000;
  initial_approval public.approval_status;
begin
  if is_bootstrap_admin then
    initial_approval := 'approved'::public.approval_status;
  elsif public.get_email_send_count() >= email_limit then
    initial_approval := 'pending_on_hold'::public.approval_status;
  else
    initial_approval := 'pending'::public.approval_status;
  end if;

  insert into public.profiles (
    id, full_name, email, role, permissions, is_system_admin, approval_status
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.email,
    case when is_bootstrap_admin then 'admin'::public.user_role else 'staff'::public.user_role end,
    case
      when is_bootstrap_admin then jsonb_build_object('dashboard', true, 'portfolio', true, 'admin', true)
      else jsonb_build_object('dashboard', true, 'portfolio', true, 'admin', false)
    end,
    is_bootstrap_admin,
    initial_approval
  );

  select id into assigned_role_id
  from public.app_roles
  where slug = case when is_bootstrap_admin then 'super-admin' else 'sales-rep' end;

  if assigned_role_id is not null then
    insert into public.user_role_assignments (user_id, role_id)
    values (new.id, assigned_role_id)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
