# Sales Pipeline

A lightweight sales CRM for collecting website form leads, managing assignments, and (Phase 3) syncing Gmail threads. Built from patterns in [Insuite_apps](https://github.com/adrianDWF/Insuite_apps) as a **separate app** with its own Supabase, GitHub, and Vercel projects.

## Stack

| Layer | Tech |
|-------|------|
| Web | Next.js 15, React 19, shadcn/ui (Pegasus patterns) |
| API | Hono on Vercel |
| Auth/DB | Supabase (RLS, custom roles, approval workflow) |
| Monorepo | pnpm + Turborepo |

## Project structure

```
apps/web/              Next.js frontend
apps/api/              Hono API (webhooks, future Gmail OAuth)
packages/shared/       Zod schemas + permissions
packages/credentials/  Google OAuth token helpers (for Phase 3)
supabase/migrations/   Database schema
```

## Local development

1. **Create a new Supabase project** at [supabase.com/dashboard](https://supabase.com/dashboard) — do not reuse Insuite production.

2. **Apply migrations:**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```
   Or paste `supabase/migrations/20260803100000_sales_pipeline_core.sql` in the SQL editor.

3. **Configure env:**
   ```bash
   cp .env.example apps/web/.env.local
   cp apps/api/.env.example apps/api/.env
   ```
   Fill in Supabase URL/keys, generate secrets:
   ```bash
   openssl rand -base64 32   # TOKEN_ENCRYPTION_KEY
   openssl rand -hex 32      # OAUTH_STATE_SECRET
   openssl rand -hex 32      # LEAD_WEBHOOK_SECRET
   ```

4. **Install and run:**
   ```bash
   pnpm setup
   pnpm dev:local
   ```
   Web: http://localhost:3000 · API: http://localhost:4000

## Supabase setup checklist

- [ ] Create new project (separate from Insuite)
- [ ] Enable **Email** auth provider
- [ ] Enable **Google** auth provider (for sales login)
- [ ] Add redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://YOUR-WEB-DOMAIN.vercel.app/auth/callback`
- [ ] Run migration `20260803100000_sales_pipeline_core.sql`
- [ ] Copy project URL, anon key, service role key, JWT secret into env files

## Vercel deployment (two projects)

### Web (`sales-pipeline-web`)

| Setting | Value |
|---------|--------|
| Root directory | `apps/web` |
| Framework | Next.js |

Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`

### API (`sales-pipeline-api`)

| Setting | Value |
|---------|--------|
| Root directory | `apps/api` |
| Framework | Hono |

Env vars: all Supabase keys, `OAUTH_STATE_SECRET`, `TOKEN_ENCRYPTION_KEY`, `GOOGLE_CLIENT_ID/SECRET`, `LEAD_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`

## GitHub

Repository: [github.com/adrianDWF/sales-pipeline](https://github.com/adrianDWF/sales-pipeline)

CI runs on push/PR to `main`: typecheck → lint → build → test.

## Phase roadmap

| Phase | Status | Scope |
|-------|--------|--------|
| **0** | Done | Monorepo scaffold, auth shell, admin roles, webhook stub |
| **1** | Done (apply migration) | `leads` table, webhook → DB, leads list UI |
| **2** | Planned | Assignment rules, notifications |
| **3** | Planned | Gmail OAuth + thread linking |

## Insuite safety

This repo was bootstrapped by **copying** from Insuite_apps. The Insuite repository at `/Users/adrste23/Documents/insuite-site/Insuite_apps` was **not modified**. All changes live only in this repo with separate infrastructure.

## Apply Phase 1 migration

Run in Supabase **SQL Editor**:

`supabase/migrations/20260803120000_leads.sql`

## Webhook test

```bash
source apps/api/.env
curl -X POST http://localhost:4000/webhooks/leads \
  -H "Authorization: Bearer $LEAD_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","message":"Interested in pricing","external_id":"test-001"}'
```

Then open http://localhost:3000/leads to see the lead.
