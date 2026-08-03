#!/usr/bin/env bash
# Deploy Sales Pipeline to free auto-generated URLs (no custom domain needed).
# You will get URLs like:
#   Frontend: https://sales-pipeline-web.vercel.app
#   API:      https://sales-pipeline-api-production.up.railway.app
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Sales Pipeline public deploy (free generated URLs) ==="
echo ""

# --- 1. Frontend on Vercel ---
echo "Step 1: Deploy frontend to Vercel"
echo "  (Login once if prompted — free account at vercel.com)"
echo ""

cd apps/web

if [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

npx vercel link --yes --project sales-pipeline-web 2>/dev/null || npx vercel link --yes

WEB_URL=$(npx vercel deploy --prod --yes 2>&1 | tee /dev/stderr | grep -oE 'https://[a-z0-9-]+\.vercel\.app' | tail -1)

if [ -z "$WEB_URL" ]; then
  echo ""
  echo "Could not detect Vercel URL. Check output above or run: npx vercel ls"
  WEB_URL="https://sales-pipeline-web.vercel.app"
fi

echo ""
echo "Frontend URL: $WEB_URL"
echo ""

# Set env vars on Vercel
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "${NEXT_PUBLIC_SUPABASE_URL:-https://cqqqxpprqrdmwohmklpb.supabase.co}" 2>/dev/null || true
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "${NEXT_PUBLIC_SUPABASE_ANON_KEY}" 2>/dev/null || true
npx vercel env add NEXT_PUBLIC_APP_URL production <<< "$WEB_URL" 2>/dev/null || true

cd "$ROOT"

echo "Step 2: Deploy API to Railway (optional, for Search Console connect)"
echo "  1. Go to https://railway.app → New Project → Deploy from GitHub"
echo "  2. Root directory: apps/api"
echo "  3. Add env vars from apps/api/.env"
echo "  4. Set GOOGLE_REDIRECT_URI to your Railway URL + /auth/google/callback"
echo "  5. Copy Railway URL and run:"
echo "     cd apps/web && npx vercel env add API_URL production"
echo ""

echo "Step 3: Update Supabase Auth URLs"
echo "  https://supabase.com/dashboard/project/cqqqxpprqrdmwohmklpb/auth/url-configuration"
echo "  Site URL:        $WEB_URL"
echo "  Redirect URLs:   $WEB_URL/auth/callback"
echo ""

echo "Done! Share this link: $WEB_URL"
