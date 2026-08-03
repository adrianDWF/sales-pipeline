#!/usr/bin/env bash
# One-shot: Vercel deploy, API env bootstrap, GitHub secret instructions.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERCEL_CLI="${VERCEL_CLI:-npx --yes vercel@55.0.0}"
VERCEL_SCOPE="${VERCEL_SCOPE:-dwf2026}"
VERCEL_SCOPE_FLAG=(--scope "$VERCEL_SCOPE")

echo "=== Sales Pipeline complete production setup ==="
echo ""

# 1. Regenerate CRON_SECRET and set on API (for GitHub Actions worker fallback)
if [[ -z "${CRON_SECRET:-}" ]]; then
  CRON_SECRET="$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
fi

echo "==> Setting CRON_SECRET on sales-pipeline-api"
cd apps/api
$VERCEL_CLI link --yes --project sales-pipeline-api "${VERCEL_SCOPE_FLAG[@]}" >/dev/null 2>&1 || true
$VERCEL_CLI env rm CRON_SECRET production "${VERCEL_SCOPE_FLAG[@]}" --yes 2>/dev/null || true
printf '%s' "$CRON_SECRET" | $VERCEL_CLI env add CRON_SECRET production "${VERCEL_SCOPE_FLAG[@]}"
$VERCEL_CLI env rm WORKER_NAME production "${VERCEL_SCOPE_FLAG[@]}" --yes 2>/dev/null || true
printf '%s' "github-actions-worker" | $VERCEL_CLI env add WORKER_NAME production "${VERCEL_SCOPE_FLAG[@]}"
$VERCEL_CLI env rm WORKER_QUEUES production "${VERCEL_SCOPE_FLAG[@]}" --yes 2>/dev/null || true
printf '%s' "default,google,meta,seo" | $VERCEL_CLI env add WORKER_QUEUES production "${VERCEL_SCOPE_FLAG[@]}"
cd "$ROOT"

echo ""
echo "==> IMPORTANT: Add this GitHub secret (Settings → Secrets → Actions):"
echo "    Name:  CRON_SECRET"
echo "    Value: (saved locally to .cron-secret.local — do not commit)"
printf '%s' "$CRON_SECRET" > "$ROOT/.cron-secret.local"
chmod 600 "$ROOT/.cron-secret.local"
echo "    Also copy from: $ROOT/.cron-secret.local"
echo ""

echo "==> Connect Supabase to sales-pipeline-api (required for job processing)"
echo "    1. Open https://vercel.com/dwf2026/sales-pipeline-api/stores"
echo "    2. Add Integration → Supabase → project cqqqxpprqrdmwohmklpb"
echo "    3. Connect the same Supabase project as sales-pipeline-web"
echo ""

echo "==> Railway worker (optional — preferred for production)"
echo "    1. Project token: Railway project → Settings → Tokens → Generate"
echo "    2. GitHub secret: RAILWAY_TOKEN (project token, NOT account token)"
echo "    3. Or run: RAILWAY_TOKEN=... ./scripts/deploy-worker-railway.sh"
echo ""

echo "==> Deploying web + API to Vercel"
pnpm deploy:prod

echo ""
echo "==> Done"
echo "Web:  https://sales-pipeline-web.vercel.app"
echo "API:  https://sales-pipeline-api.vercel.app"
echo ""
echo "After Supabase is linked on sales-pipeline-api, sync jobs process via:"
echo "  - GitHub Actions: sync-job-processor.yml (every 5 min)"
echo "  - Railway worker (when RAILWAY_TOKEN is set)"
