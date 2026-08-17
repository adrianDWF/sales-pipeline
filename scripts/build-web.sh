#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

pnpm --filter @sales-pipeline/shared build
pnpm --filter @sales-pipeline/credentials build
pnpm --filter @sales-pipeline/web build
