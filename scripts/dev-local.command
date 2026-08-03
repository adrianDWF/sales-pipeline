#!/usr/bin/env bash
set -euo pipefail

clear
cd "$(dirname "$0")/.."

echo "Starting Insuite locally..."
echo "Open this in Terminal if you want logs in a separate window."
echo "Press Ctrl+C to stop both web and API."
echo

COREPACK_ENABLE_STRICT=0 ./scripts/dev-local.sh
