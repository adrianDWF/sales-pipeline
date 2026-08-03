#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export COREPACK_ENABLE_STRICT=0

if [ ! -f "apps/web/.env.local" ]; then
  cp .env.example apps/web/.env.local
fi

if [ ! -f "apps/api/.env" ]; then
  cp apps/api/.env.example apps/api/.env
fi

if [ ! -d "node_modules" ]; then
  COREPACK_ENABLE_STRICT=0 pnpm install
fi

if ! grep -q "^NEXT_PUBLIC_API_URL=" apps/web/.env.local; then
  printf '\nNEXT_PUBLIC_API_URL=http://localhost:4000\n' >> apps/web/.env.local
fi

if ! grep -q "^NEXT_PUBLIC_APP_URL=" apps/web/.env.local; then
  printf 'NEXT_PUBLIC_APP_URL=http://localhost:3000\n' >> apps/web/.env.local
fi

cleanup() {
  echo ""
  echo "Shutting down local services..."
  if [ -n "${WEB_PID:-}" ]; then
    kill "$WEB_PID" 2>/dev/null || true
  fi
  if [ -n "${API_PID:-}" ]; then
    kill "$API_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

echo "Starting web and API in parallel..."
(
  cd apps/web
  COREPACK_ENABLE_STRICT=0 pnpm dev
) &
WEB_PID=$!

(
  cd apps/api
  COREPACK_ENABLE_STRICT=0 pnpm dev
) &
API_PID=$!

wait "$WEB_PID" "$API_PID"
