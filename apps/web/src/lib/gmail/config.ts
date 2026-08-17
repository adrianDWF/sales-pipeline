import { resolveGoogleOAuthClient } from "@sales-pipeline/credentials";

export const GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export const GMAIL_OAUTH_SCOPES = [
  GMAIL_READONLY_SCOPE,
  "openid",
  "email",
  "profile",
];

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}

export function getGmailRedirectUri(): string {
  return `${getAppUrl()}/api/auth/gmail/callback`;
}

export function isGmailOAuthConfigured(): boolean {
  try {
    resolveGoogleOAuthClient();
    return Boolean(process.env.OAUTH_STATE_SECRET && process.env.TOKEN_ENCRYPTION_KEY);
  } catch {
    return false;
  }
}

export function buildGmailAuthUrl(state: string): string {
  const client = resolveGoogleOAuthClient();
  const params = new URLSearchParams({
    client_id: client.clientId,
    redirect_uri: getGmailRedirectUri(),
    response_type: "code",
    scope: GMAIL_OAUTH_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGmailAuthCode(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}> {
  const client = resolveGoogleOAuthClient();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      redirect_uri: getGmailRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gmail token exchange failed: ${body}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  }>;
}

export async function fetchGoogleAccountEmail(accessToken: string): Promise<string> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google userinfo failed: ${body}`);
  }

  const data = (await response.json()) as { email?: string };
  if (!data.email) {
    throw new Error("Google account email missing");
  }

  return data.email.toLowerCase();
}

export function parseScopes(scope?: string): string[] {
  if (!scope) return [...GMAIL_OAUTH_SCOPES];
  return scope.split(/\s+/).filter(Boolean);
}

export function getExcludedGmailEmails(): Set<string> {
  const raw = process.env.GMAIL_EXCLUDED_EMAILS ?? "adrian@dwf.ro";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isExcludedGmailEmail(email: string): boolean {
  return getExcludedGmailEmails().has(email.trim().toLowerCase());
}
