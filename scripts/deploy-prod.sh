#!/usr/bin/env bash
# Deploy sales-pipeline-web + sales-pipeline-api to Vercel production.
# Runs both deploys in parallel with compressed uploads and scoped pnpm installs.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERCEL_CLI="${VERCEL_CLI:-npx --yes vercel@55.0.0}"
VERCEL_SCOPE="${VERCEL_SCOPE:-dwf2026}"
DEPLOY_FLAGS=(deploy --prod --yes --archive=tgz --scope "$VERCEL_SCOPE")
PARALLEL="${DEPLOY_PARALLEL:-1}"

WEB_LOG="$(mktemp)"
API_LOG="$(mktemp)"
trap 'rm -f "$WEB_LOG" "$API_LOG"' EXIT

run_web() {
  echo "==> [web] Starting sales-pipeline-web production deploy"
  $VERCEL_CLI "${DEPLOY_FLAGS[@]}" --project sales-pipeline-web >"$WEB_LOG" 2>&1
}

run_api() {
  echo "==> [api] Starting sales-pipeline-api production deploy"
  $VERCEL_CLI "${DEPLOY_FLAGS[@]}" --project sales-pipeline-api >"$API_LOG" 2>&1
}

# Deploy from monorepo root — Vercel project rootDirectory is apps/web | apps/api.

if [[ "$PARALLEL" == "1" ]]; then
  echo "==> Deploying web + API in parallel (set DEPLOY_PARALLEL=0 for sequential)"
  run_web &
  WEB_PID=$!
  run_api &
  API_PID=$!

  WEB_OK=0
  API_OK=0
  wait "$WEB_PID" || WEB_OK=$?
  wait "$API_PID" || API_OK=$?
else
  echo "==> Deploying sequentially"
  WEB_OK=0
  API_OK=0
  run_web || WEB_OK=$?
  run_api || API_OK=$?
fi

echo ""
echo "=== Web deploy log ==="
cat "$WEB_LOG"
echo ""
echo "=== API deploy log ==="
cat "$API_LOG"

if [[ "$WEB_OK" -ne 0 || "$API_OK" -ne 0 ]]; then
  echo "Deploy failed (web exit=$WEB_OK, api exit=$API_OK)" >&2
  exit 1
fi

echo ""
echo "==> Done. Web: https://sales-pipeline-web.vercel.app  API: https://sales-pipeline-api-one.vercel.app"
