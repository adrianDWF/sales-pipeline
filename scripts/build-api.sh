#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

for pkg in @sales-pipeline/shared @sales-pipeline/credentials @sales-pipeline/api; do
  pnpm --filter "$pkg" build
done
