#!/usr/bin/env bash
set -euo pipefail

# Push auth redirect URLs from supabase/config.toml to the linked remote project.
# Requires: npx supabase login  (or SUPABASE_ACCESS_TOKEN in env)
#           npx supabase link --project-ref cabrpgbsurvtxmrlnkpj

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_REF="cabrpgbsurvtxmrlnkpj"

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ] && [ ! -f "$HOME/.supabase/access-token" ]; then
  echo "Supabase CLI not logged in."
  echo "Run: npx supabase login"
  echo "Then: npx supabase link --project-ref ${PROJECT_REF}"
  echo "Then re-run this script."
  exit 1
fi

if [ ! -f supabase/.temp/project-ref ] && [ ! -f .supabase/project-ref ]; then
  echo "Linking project ${PROJECT_REF}..."
  npx supabase link --project-ref "${PROJECT_REF}"
fi

echo "Pushing auth config (redirect URLs) from supabase/config.toml..."
npx supabase config push

echo "Done. Redirect URLs should include:"
echo "  http://localhost:3000/auth/callback"
echo "  https://sales-pipeline-web.vercel.app/auth/callback"
