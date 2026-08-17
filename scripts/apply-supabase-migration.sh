#!/usr/bin/env bash
set -euo pipefail

# Apply a SQL migration via Supabase Management API.
# Get token: https://supabase.com/dashboard/account/tokens
#
# Usage:
#   SUPABASE_ACCESS_TOKEN=sbp_xxx ./scripts/apply-supabase-migration.sh supabase/migrations/20260817170000_user_gmail_connections.sql

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_REF="cabrpgbsurvtxmrlnkpj"
TOKEN="${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN from supabase.com/dashboard/account/tokens}"
MIGRATION_FILE="${1:?Usage: $0 path/to/migration.sql}"

NAME="$(basename "$MIGRATION_FILE" .sql)"
QUERY="$(cat "$ROOT/$MIGRATION_FILE")"

curl -sS -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/migrations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$(node -e "
const query = process.argv[1];
const name = process.argv[2];
process.stdout.write(JSON.stringify({ query, name }));
" "$QUERY" "$NAME")"

echo ""
echo "Migration applied: $MIGRATION_FILE"
