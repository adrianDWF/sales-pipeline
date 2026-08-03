type EnvIssue = {
  key: string;
  message: string;
};

const REQUIRED_API_ENV = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OAUTH_STATE_SECRET",
  "TOKEN_ENCRYPTION_KEY",
  "NEXT_PUBLIC_APP_URL",
] as const;

const GOOGLE_OAUTH_ENV = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
] as const;

function readEnv(key: string): string | undefined {
  return process.env[key] ?? process.env[key.replace("SUPABASE_", "NEXT_PUBLIC_SUPABASE_")];
}

export function validateApiEnv(options: { strict?: boolean } = {}): EnvIssue[] {
  const issues: EnvIssue[] = [];

  for (const key of REQUIRED_API_ENV) {
    if (!readEnv(key)) {
      issues.push({ key, message: "Missing required environment variable" });
    }
  }

  for (const key of GOOGLE_OAUTH_ENV) {
    if (!process.env[key]) {
      issues.push({ key, message: "Missing Google OAuth environment variable" });
    }
  }

  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    issues.push({
      key: "TOKEN_ENCRYPTION_KEY",
      message: "Missing required environment variable",
    });
  } else {
    try {
      const key = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY, "base64");
      if (key.length !== 32) {
        issues.push({
          key: "TOKEN_ENCRYPTION_KEY",
          message: "Must decode to exactly 32 bytes",
        });
      }
    } catch {
      issues.push({
        key: "TOKEN_ENCRYPTION_KEY",
        message: "Must be valid base64",
      });
    }
  }

  if (process.env.OAUTH_STATE_SECRET && process.env.OAUTH_STATE_SECRET.length < 32) {
    issues.push({
      key: "OAUTH_STATE_SECRET",
      message: "Use at least 32 characters",
    });
  }

  if (options.strict && issues.some((i) => REQUIRED_API_ENV.includes(i.key as (typeof REQUIRED_API_ENV)[number]))) {
    const missing = issues
      .filter((i) => REQUIRED_API_ENV.includes(i.key as (typeof REQUIRED_API_ENV)[number]))
      .map((i) => i.key)
      .join(", ");
    throw new Error(`Missing critical API environment variables: ${missing}`);
  }

  return issues;
}

export function assertApiEnvOnStartup() {
  const issues = validateApiEnv({ strict: true });
  const encryptionIssues = issues.filter((i) => i.key === "TOKEN_ENCRYPTION_KEY");
  if (encryptionIssues.length > 0) {
    throw new Error(
      `Invalid TOKEN_ENCRYPTION_KEY: ${encryptionIssues.map((i) => i.message).join("; ")}`,
    );
  }
}
