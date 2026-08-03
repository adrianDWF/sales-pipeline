#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  pnpm install
fi

if [ ! -f "apps/web/.env.local" ]; then
  cp .env.example apps/web/.env.local
  echo "Created apps/web/.env.local — add your Supabase anon key before using auth."
fi

pnpm --filter @sales-pipeline/web dev
