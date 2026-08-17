-- Gmail OAuth connections for lead communications (Comunicări tab)

create table public.user_gmail_connections (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  google_email text not null,
  refresh_token_encrypted text not null,
  access_token_encrypted text,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index user_gmail_connections_google_email_idx
  on public.user_gmail_connections (google_email);

alter table public.user_gmail_connections enable row level security;

-- Users can read their own connection metadata (tokens are never selected client-side).
create policy "Users can view own gmail connection"
  on public.user_gmail_connections for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete own gmail connection"
  on public.user_gmail_connections for delete
  to authenticated
  using (auth.uid() = user_id);

-- Inserts/updates run via service role in OAuth callback and token refresh.

create trigger user_gmail_connections_updated_at
  before update on public.user_gmail_connections
  for each row execute function public.set_updated_at();
