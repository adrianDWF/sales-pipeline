#!/usr/bin/env bash
# Copy non-empty integration env vars from apps/api/.env to sales-pipeline-web on Vercel.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VERCEL_CLI="${VERCEL_CLI:-npx --yes vercel@55.0.0}"
API_ENV="$ROOT/apps/api/.env"
CRON_FILE="$ROOT/.cron-secret.local"

if [[ ! -f "$API_ENV" ]]; then
  echo "Missing $API_ENV"
  exit 1
fi

cd "$ROOT/apps/web"
$VERCEL_CLI link --yes --project sales-pipeline-web >/dev/null 2>&1 || true

node <<'NODE'
const fs = require("fs");
const { execSync } = require("child_process");

const apiEnvPath = process.env.API_ENV;
const cronFile = process.env.CRON_FILE;
const vercel = process.env.VERCEL_CLI || "npx --yes vercel@55.0.0";

const lines = fs.readFileSync(apiEnvPath, "utf8").split("\n");
const values = {};
for (const line of lines) {
  if (!line || line.startsWith("#") || !line.includes("=")) continue;
  const index = line.indexOf("=");
  const key = line.slice(0, index).trim();
  const value = line.slice(index + 1).trim();
  if (value) values[key] = value;
}

if (fs.existsSync(cronFile)) {
  values.CRON_SECRET = fs.readFileSync(cronFile, "utf8").trim();
}
values.WORKER_ID = "web-cron";

const keys = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "OAUTH_STATE_SECRET",
  "TOKEN_ENCRYPTION_KEY",
  "GMAIL_EXCLUDED_EMAILS",
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "META_APP_ID",
  "META_APP_SECRET",
  "META_REDIRECT_URI",
  "TIKTOK_APP_ID",
  "TIKTOK_APP_SECRET",
  "TIKTOK_REDIRECT_URI",
  "PAGESPEED_INSIGHTS_API_KEY",
  "CRUX_API_KEY",
  "DATAFORSEO_LOGIN",
  "DATAFORSEO_PASSWORD",
  "CRON_SECRET",
  "WORKER_ID",
];

for (const key of keys) {
  const value = values[key];
  if (!value || value.length < 2) continue;
  console.log(`sync ${key} -> sales-pipeline-web`);
  try {
    execSync(`printf '%s' ${JSON.stringify(value)} | ${vercel} env add ${key} production`, {
      cwd: "apps/web",
      stdio: "inherit",
    });
  } catch {
    console.log(`skip ${key} (already exists)`);
  }
}
NODE

echo "==> Web env sync complete"
