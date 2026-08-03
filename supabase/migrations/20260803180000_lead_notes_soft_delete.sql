-- Soft delete for lead notes + super-user admin controls

alter table public.lead_notes
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users (id) on delete set null;

create index if not exists lead_notes_deleted_at_idx on public.lead_notes (deleted_at)
  where deleted_at is not null;

create or replace function public.is_super_user()
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
      and ar.slug = 'super-admin'
  );
$$;

revoke all on function public.is_super_user() from public;
grant execute on function public.is_super_user() to authenticated;

drop policy if exists "View lead notes" on public.lead_notes;
drop policy if exists "Edit lead notes" on public.lead_notes;

create policy "View lead notes"
  on public.lead_notes for select to authenticated
  using (
    public.can_view_lead(lead_id)
    and (deleted_at is null or public.is_super_user())
  );

create policy "Insert lead notes"
  on public.lead_notes for insert to authenticated
  with check (
    public.can_view_lead(lead_id)
    and author_id = auth.uid()
  );

create policy "Update lead notes"
  on public.lead_notes for update to authenticated
  using (
    public.can_view_lead(lead_id)
    and (
      (deleted_at is null and (author_id = auth.uid() or public.is_super_user()))
      or public.is_super_user()
    )
  )
  with check (
    public.can_view_lead(lead_id)
    and (
      author_id = auth.uid()
      or public.is_super_user()
    )
  );

create policy "Hard delete lead notes"
  on public.lead_notes for delete to authenticated
  using (public.is_super_user());
