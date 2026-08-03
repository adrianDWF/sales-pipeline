#!/usr/bin/env bash
# Deploy apps/worker to Railway (long-running sync processor).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RAILWAY_CLI="${RAILWAY_CLI:-npx --yes @railway/cli@5.26.0}"

echo "==> Railway worker deploy"
echo ""

if [ -z "${RAILWAY_TOKEN:-}" ]; then
  echo "RAILWAY_TOKEN is not set."
  echo ""
  echo "Create a project token in Railway project → Settings → Tokens:"
  echo "  export RAILWAY_TOKEN=<project-token>"
  echo "  ./scripts/deploy-worker-railway.sh"
  exit 1
fi

# Upload the workspace root so pnpm can resolve workspace:* dependencies.
$RAILWAY_CLI up --detach --service "${RAILWAY_SERVICE:-insuite-worker}"

echo ""
echo "==> Worker deploy triggered. Required Railway env vars:"
echo "  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TOKEN_ENCRYPTION_KEY"
echo "  WORKER_NAME=insuite-worker, WORKER_QUEUES=default"
echo "  SYNC_POLL_MS=2000, SYNC_MAX_CONCURRENT=3"
echo "  Plus integration secrets (same as sales-pipeline-api)"
