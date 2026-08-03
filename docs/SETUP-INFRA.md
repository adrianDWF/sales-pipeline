# Infrastructure setup (between Phase 0 and Phase 1)

This is **not** all of Phase 1. It is the shared foundation both apps need before lead features ship.

## Phase map

| Phase | What it includes |
|-------|------------------|
| **0** | Monorepo scaffold, auth shell, admin roles, webhook stub ✅ |
| **Infra** | Supabase project, local env, Vercel projects ← **you are here** |
| **1** | `leads` table, webhook saves to DB, leads list UI |
| **2** | Assignment rules, notifications |
| **3** | Gmail OAuth + email threads on leads |

---

## 1. Supabase (manual — requires your login)

The CLI is not logged in on this machine yet.

### Option A — Dashboard (fastest)

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Name: `sales-pipeline` (any region/password you prefer)
3. When ready, open **Project Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` key (keep secret)
   - JWT secret (Settings → API → JWT Settings)
4. Run from repo root:
   ```bash
   ./scripts/fill-supabase-env.sh \
     "https://YOUR_REF.supabase.co" \
     "YOUR_ANON_KEY" \
     "YOUR_SERVICE_ROLE_KEY" \
     "YOUR_JWT_SECRET"
   ```
5. Open **SQL Editor** → paste and run:
   `supabase/migrations/20260803100000_sales_pipeline_core.sql`
6. **Authentication → Providers**: enable Email + Google
7. **Authentication → URL configuration** → Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://sales-pipeline-web.vercel.app/auth/callback`

### Option B — Supabase CLI

```bash
npx supabase login
npx supabase projects create sales-pipeline --org-id YOUR_ORG --db-password 'choose-a-strong-password' --region eu-central-1
npx supabase link --project-ref YOUR_REF
npx supabase db push
```

Then run `./scripts/fill-supabase-env.sh` with the keys from the dashboard.

---

## 2. Local env ✅ (generated)

Already created on this machine:

```bash
./scripts/setup-local-env.sh   # re-run anytime to regenerate secrets
```

Files:
- `apps/web/.env.local` — Supabase URL/anon key still empty until step 1
- `apps/api/.env` — API secrets generated; Supabase keys empty until step 1

**Important:** The old copied Insuite Supabase URL was removed. Do not point this app at Insuite production.

---

## 3. Vercel ✅ (projects created)

| Project | Team | URL (after first deploy) |
|---------|------|-------------------------|
| `sales-pipeline-web` | dwf2026 | https://sales-pipeline-web.vercel.app |
| `sales-pipeline-api` | dwf2026 | https://sales-pipeline-api-one.vercel.app |

### Connect GitHub (one-time, dashboard)

For **each** project in [vercel.com/dwf2026](https://vercel.com):

1. **Settings → Git** → Connect `adrianDWF/sales-pipeline`
2. Set **Root Directory**:
   - Web: `apps/web`
   - API: `apps/api`
3. Production branch: `main`

Build settings are already in each app's `vercel.json`.

### Production env vars

After Supabase is ready, add to **both** Vercel projects (web needs public + server keys; API needs all secrets from `apps/api/.env`).

Web minimum:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL=https://sales-pipeline-web.vercel.app`
- `NEXT_PUBLIC_API_URL=https://sales-pipeline-api-one.vercel.app`
- `SUPABASE_SERVICE_ROLE_KEY` (server actions / admin)

API minimum:
- All Supabase keys
- `NEXT_PUBLIC_APP_URL`
- `OAUTH_STATE_SECRET`, `TOKEN_ENCRYPTION_KEY`, `LEAD_WEBHOOK_SECRET`

---

## 4. Verify locally

```bash
pnpm dev:local
```

Open http://localhost:3000 → sign up / login (after Supabase auth is configured).

Test webhook stub:

```bash
source apps/api/.env
curl -X POST http://localhost:4000/webhooks/leads \
  -H "Authorization: Bearer $LEAD_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com"}'
```

---

## What comes next (Phase 1)

Once infra is done, Phase 1 adds:
- `leads` table + RLS
- Webhook writes to Supabase
- `/leads` list with real data

Say **start Phase 1** when Supabase keys are in place.
