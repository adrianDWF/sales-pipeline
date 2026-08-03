#!/usr/bin/env bash
# One-shot production ops: cron worker secret, Supabase link on API, redeploy.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERCEL_CLI="${VERCEL_CLI:-npx --yes vercel@55.0.0}"
VERCEL_SCOPE="${VERCEL_SCOPE:-dwf2026}"
VERCEL_SCOPE_FLAG=(--scope "$VERCEL_SCOPE")
PROJECT_ID="cqqqxpprqrdmwohmklpb"

echo "==> Sales Pipeline production ops bootstrap"
echo ""

# 1. Cron secret for Vercel worker tick
if [[ -z "${CRON_SECRET:-}" ]]; then
  if command -v openssl >/dev/null 2>&1; then
    CRON_SECRET="$(openssl rand -hex 32)"
  else
    CRON_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
  fi
fi

echo "==> Setting CRON_SECRET on sales-pipeline-api (Vercel)"
cd apps/api
$VERCEL_CLI link --yes --project sales-pipeline-api "${VERCEL_SCOPE_FLAG[@]}" >/dev/null 2>&1 || true
# Remove stale value if present, then add fresh secret
$VERCEL_CLI env rm CRON_SECRET production "${VERCEL_SCOPE_FLAG[@]}" --yes 2>/dev/null || true
printf '%s' "$CRON_SECRET" | $VERCEL_CLI env add CRON_SECRET production "${VERCEL_SCOPE_FLAG[@]}"
$VERCEL_CLI env rm WORKER_ID production "${VERCEL_SCOPE_FLAG[@]}" --yes 2>/dev/null || true
printf '%s' "vercel-cron" | $VERCEL_CLI env add WORKER_ID production "${VERCEL_SCOPE_FLAG[@]}"
cd "$ROOT"

printf '%s' "$CRON_SECRET" > "$ROOT/.cron-secret.local"
chmod 600 "$ROOT/.cron-secret.local"

echo "==> CRON_SECRET configured on sales-pipeline-api (value saved to .cron-secret.local — do not commit)"
echo ""

# 2. Ensure Supabase integration env vars exist on API (copy from web project if missing)
echo "==> Syncing Supabase env vars from sales-pipeline-web to sales-pipeline-api"
cd apps/web
$VERCEL_CLI link --yes --project sales-pipeline-web "${VERCEL_SCOPE_FLAG[@]}" >/dev/null 2>&1 || true
$VERCEL_CLI env pull "$ROOT/.tmp-web-vercel.env" --environment=production --yes "${VERCEL_SCOPE_FLAG[@]}" >/dev/null
cd "$ROOT/apps/api"
$VERCEL_CLI link --yes --project sales-pipeline-api "${VERCEL_SCOPE_FLAG[@]}" >/dev/null 2>&1 || true
$VERCEL_CLI env pull "$ROOT/.tmp-api-vercel.env" --environment=production --yes "${VERCEL_SCOPE_FLAG[@]}" >/dev/null
cd "$ROOT"

node <<'NODE'
const fs = require("fs");
const { execSync } = require("child_process");

function parse(path) {
  if (!fs.existsSync(path)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(path, "utf8")
      .split("\n")
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        let value = line.slice(index + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        return [line.slice(0, index).trim(), value];
      }),
  );
}

const web = parse(".tmp-web-vercel.env");
const api = parse(".tmp-api-vercel.env");
const syncKeys = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_JWT_SECRET",
];
const scope = process.env.VERCEL_SCOPE || "dwf2026";

for (const key of syncKeys) {
  const value = web[key];
  const current = api[key];
  if (!value || value.length < 8) continue;
  if (current && current.length >= 8) {
    console.log(`skip ${key} (already set on api)`);
    continue;
  }
  console.log(`add ${key} to sales-pipeline-api`);
  try {
    execSync(
      `cd apps/api && printf '%s' ${JSON.stringify(value)} | npx --yes vercel@55.0.0 env add ${key} production --scope ${scope}`,
      { stdio: "inherit" },
    );
  } catch {
    console.log(`skip ${key} (already exists on api)`);
  }
}
NODE

rm -f "$ROOT/.tmp-web-vercel.env" "$ROOT/.tmp-api-vercel.env"
echo ""

# 3. Deploy API + web
echo "==> Deploying production (web + API)"
cd "$ROOT"
pnpm deploy:prod

echo ""
echo "==> Done"
echo "Sync worker: GitHub Actions runs every 5 minutes (.github/workflows/sync-job-processor.yml)"
echo "Health check: every 6 hours (.github/workflows/sync-worker.yml)"
echo ""
echo "Set GitHub Actions secret (same value as Vercel sales-pipeline-api CRON_SECRET):"
echo "  gh secret set CRON_SECRET --body \"\$(cat .cron-secret.local)\""
echo ""
echo "Manual test (replace with your secret — do not paste into chat):"
echo "  curl -H \"Authorization: Bearer \$(cat .cron-secret.local)\" -X POST https://sales-pipeline-api.vercel.app/internal/worker/tick"
echo ""
echo "Optional: deploy apps/worker on Railway for primary job processing (see apps/worker/README.md)."
echo ""
echo "Optional Google server keys (PageSpeed + CrUX) — add in Vercel sales-pipeline-api when ready:"
echo "  PAGESPEED_INSIGHTS_API_KEY, CRUX_API_KEY"
echo "  https://console.cloud.google.com/apis/credentials (enable PageSpeed + Chrome UX Report APIs)"
echo ""
echo "Supabase project: https://supabase.com/dashboard/project/${PROJECT_ID}"
