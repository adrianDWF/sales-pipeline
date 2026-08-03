const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export type GoogleOAuthClient = {
  key: string;
  clientId: string;
  clientSecret: string;
};

type GoogleOAuthClientMap = Record<
  string,
  { clientId?: string; clientSecret?: string; client_id?: string; client_secret?: string }
>;

export function getActiveGoogleOAuthClientKey(): string {
  return process.env.GOOGLE_OAUTH_ACTIVE_CLIENT_KEY?.trim() || "google-production-v2";
}

export function resolveGoogleOAuthClient(key?: string | null): GoogleOAuthClient {
  const resolvedKey = key?.trim() || getActiveGoogleOAuthClientKey();
  const rawRegistry = process.env.GOOGLE_OAUTH_CLIENTS_JSON;

  if (rawRegistry) {
    let registry: GoogleOAuthClientMap;
    try {
      registry = JSON.parse(rawRegistry) as GoogleOAuthClientMap;
    } catch {
      throw new Error("google_oauth_registry_invalid");
    }
    const entry = registry[resolvedKey];
    const clientId = entry?.clientId ?? entry?.client_id;
    const clientSecret = entry?.clientSecret ?? entry?.client_secret;
    if (clientId && clientSecret) {
      return { key: resolvedKey, clientId, clientSecret };
    }
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (resolvedKey === getActiveGoogleOAuthClientKey() && clientId && clientSecret) {
    return { key: resolvedKey, clientId, clientSecret };
  }

  throw new Error(`google_oauth_client_credentials_missing:${resolvedKey}`);
}

export async function refreshGoogleToken(
  refreshToken: string,
  oauthClientKey?: string | null,
) {
  const client = resolveGoogleOAuthClient(oauthClientKey);
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: client.clientId,
      client_secret: client.clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google token refresh failed (${client.key}): ${body}`);
  }

  return response.json() as Promise<{
    access_token: string;
    expires_in?: number;
    refresh_token?: string;
  }>;
}
