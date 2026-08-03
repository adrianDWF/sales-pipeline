#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

WEB_PROJECT="sales-pipeline-web"
API_PROJECT="sales-pipeline-api"
SCOPE="dwf2026"

read_env() {
  local file="$1"
  local key="$2"
  grep -E "^${key}=" "$file" | head -1 | cut -d= -f2- | sed 's/^"//;s/"$//'
}

SUPABASE_URL="$(read_env apps/api/.env SUPABASE_URL)"
ANON="$(read_env apps/api/.env NEXT_PUBLIC_SUPABASE_ANON_KEY)"
SERVICE="$(read_env apps/api/.env SUPABASE_SERVICE_ROLE_KEY)"
JWT="$(read_env apps/api/.env SUPABASE_JWT_SECRET)"
OAUTH="$(read_env apps/api/.env OAUTH_STATE_SECRET)"
TOKEN="$(read_env apps/api/.env TOKEN_ENCRYPTION_KEY)"
WEBHOOK="$(read_env apps/api/.env LEAD_WEBHOOK_SECRET)"

add_env() {
  local project="$1"
  local name="$2"
  local value="$3"
  for env in production preview development; do
    printf '%s' "$value" | npx vercel env add "$name" "$env" \
      --force --project "$project" --scope "$SCOPE" --yes 2>/dev/null || true
  done
}

echo "Setting env on ${WEB_PROJECT}..."
add_env "$WEB_PROJECT" "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
add_env "$WEB_PROJECT" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$ANON"
add_env "$WEB_PROJECT" "NEXT_PUBLIC_APP_URL" "https://sales-pipeline-web.vercel.app"
add_env "$WEB_PROJECT" "NEXT_PUBLIC_API_URL" "https://sales-pipeline-api-one.vercel.app"
add_env "$WEB_PROJECT" "SUPABASE_SERVICE_ROLE_KEY" "$SERVICE"

echo "Setting env on ${API_PROJECT}..."
add_env "$API_PROJECT" "SUPABASE_URL" "$SUPABASE_URL"
add_env "$API_PROJECT" "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"
add_env "$API_PROJECT" "SUPABASE_ANON_KEY" "$ANON"
add_env "$API_PROJECT" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$ANON"
add_env "$API_PROJECT" "SUPABASE_SERVICE_ROLE_KEY" "$SERVICE"
add_env "$API_PROJECT" "SUPABASE_JWT_SECRET" "$JWT"
add_env "$API_PROJECT" "NEXT_PUBLIC_APP_URL" "https://sales-pipeline-web.vercel.app"
add_env "$API_PROJECT" "OAUTH_STATE_SECRET" "$OAUTH"
add_env "$API_PROJECT" "TOKEN_ENCRYPTION_KEY" "$TOKEN"
add_env "$API_PROJECT" "LEAD_WEBHOOK_SECRET" "$WEBHOOK"

echo "Vercel env sync complete."
