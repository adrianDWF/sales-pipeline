#!/usr/bin/env bash
set -euo pipefail

# Patch Supabase Auth redirect URLs via Management API.
# Get a token: https://supabase.com/dashboard/account/tokens
#
# Usage:
#   SUPABASE_ACCESS_TOKEN=sbp_xxx ./scripts/patch-supabase-auth-urls.sh

PROJECT_REF="cabrpgbsurvtxmrlnkpj"
TOKEN="${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN from supabase.com/dashboard/account/tokens}"

curl -sS -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "site_url": "http://localhost:3000",
    "uri_allow_list": "http://localhost:3000/auth/callback,https://sales-pipeline-web.vercel.app/auth/callback"
  }' | python3 -m json.tool 2>/dev/null || cat

echo ""
echo "Redirect URLs updated for ${PROJECT_REF}"
