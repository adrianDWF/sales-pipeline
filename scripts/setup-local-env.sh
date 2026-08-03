#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TOKEN_KEY="$(openssl rand -base64 32)"
OAUTH_SECRET="$(openssl rand -hex 32)"
WEBHOOK_SECRET="$(openssl rand -hex 32)"

write_web_env() {
  cat > apps/web/.env.local <<EOF
# Sales Pipeline — web (local). Fill Supabase values after creating the project.
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000

RESEND_API_KEY=
EMAIL_FROM=Sales Pipeline <onboarding@resend.dev>
EMAIL_MONTHLY_LIMIT=3000
EOF
}

write_api_env() {
  cat > apps/api/.env <<EOF
# Sales Pipeline — API (local). Fill Supabase values after creating the project.
SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

NEXT_PUBLIC_APP_URL=http://localhost:3000
PORT=4000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:4000/auth/google/callback
OAUTH_STATE_SECRET=${OAUTH_SECRET}
TOKEN_ENCRYPTION_KEY=${TOKEN_KEY}
LEAD_WEBHOOK_SECRET=${WEBHOOK_SECRET}
EOF
}

write_web_env
write_api_env

echo "Created apps/web/.env.local and apps/api/.env"
echo ""
echo "Generated API secrets (saved in apps/api/.env):"
echo "  OAUTH_STATE_SECRET=${OAUTH_SECRET}"
echo "  TOKEN_ENCRYPTION_KEY=${TOKEN_KEY}"
echo "  LEAD_WEBHOOK_SECRET=${WEBHOOK_SECRET}"
echo ""
echo "Next: create Supabase project, then run:"
echo "  ./scripts/fill-supabase-env.sh YOUR_PROJECT_REF"
echo "Or paste keys manually into both env files."
