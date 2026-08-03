#!/usr/bin/env bash
set -euo pipefail

# After creating a Supabase project, paste keys from:
# Dashboard → Project Settings → API
#
# Usage:
#   ./scripts/fill-supabase-env.sh https://abcdefgh.supabase.co eyJhbG... eyJhbG... your-jwt-secret

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ $# -lt 4 ]; then
  echo "Usage: $0 SUPABASE_URL ANON_KEY SERVICE_ROLE_KEY JWT_SECRET"
  echo ""
  echo "Example:"
  echo "  $0 https://xyz.supabase.co eyJanon... eyJservice... your-jwt-secret"
  exit 1
fi

URL="$1"
ANON="$2"
SERVICE="$3"
JWT="$4"

patch_file() {
  local file="$1"
  [ -f "$file" ] || return 0
  sed -i '' \
    -e "s|^NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=${URL}|" \
    -e "s|^SUPABASE_URL=.*|SUPABASE_URL=${URL}|" \
    -e "s|^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON}|" \
    -e "s|^SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=${ANON}|" \
    -e "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=${SERVICE}|" \
    -e "s|^SUPABASE_JWT_SECRET=.*|SUPABASE_JWT_SECRET=${JWT}|" \
    "$file"
}

patch_file apps/web/.env.local
patch_file apps/api/.env

echo "Updated Supabase keys in apps/web/.env.local and apps/api/.env"
echo ""
echo "Apply database schema:"
echo "  1. Open Supabase SQL editor"
echo "  2. Paste supabase/migrations/20260803100000_sales_pipeline_core.sql"
echo "  3. Run"
echo ""
echo "Or with Supabase CLI (after supabase login + link):"
echo "  npx supabase link --project-ref \$(echo ${URL} | sed 's|https://||;s|.supabase.co||')"
echo "  npx supabase db push"
