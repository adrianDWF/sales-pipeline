import type { SupabaseClient } from "@supabase/supabase-js";

import { isAccessTokenFresh, withConnectionRefreshLock } from "./refresh-lock.js";
import type { StoredConnection, TokenRefreshDeps } from "./types.js";

export function createCredentialsService(deps: TokenRefreshDeps) {
  async function persistRefreshedTokens(
    supabase: SupabaseClient,
    connection: StoredConnection,
    tokens: {
      access_token: string;
      refresh_token?: string | null;
      token_expires_at: string;
    },
  ): Promise<void> {
    const table = deps.getConnectionTable(connection.provider);
    const googleRefreshState =
      connection.provider === "google"
        ? {
            authorization_status: "connected",
            last_token_refresh_at: new Date().toISOString(),
            last_token_refresh_error: null,
            last_token_refresh_error_code: null,
          }
        : {};
    const { error } = await supabase
      .from(table)
      .update({
        access_token: deps.encryptToken(tokens.access_token),
        refresh_token:
          tokens.refresh_token !== undefined
            ? deps.encryptToken(tokens.refresh_token)
            : undefined,
        token_expires_at: tokens.token_expires_at,
        ...googleRefreshState,
        updated_at: new Date().toISOString(),
      })
      .eq("id", connection.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async function refreshProviderTokens(
    connection: StoredConnection,
  ): Promise<{ access_token: string; refresh_token?: string | null; token_expires_at: string }> {
    if (connection.provider === "meta") {
      const tokens = await deps.refreshMeta(connection.access_token);
      return {
        access_token: tokens.access_token,
        token_expires_at: deps.metaTokenExpiresAt(tokens.expires_in ?? 60 * 60),
      };
    }

    if (connection.provider === "tiktok") {
      if (!connection.refresh_token) {
        throw new Error("token_expired_reconnect");
      }
      const tokens =
        connection.service === "tiktok_organic"
          ? await deps.refreshTiktokOrganic(connection.refresh_token)
          : await deps.refreshTiktok(connection.refresh_token);
      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? connection.refresh_token,
        token_expires_at: deps.tiktokTokenExpiresAt(tokens.expires_in ?? 24 * 60 * 60),
      };
    }

    if (!connection.refresh_token) {
      throw new Error("token_expired_reconnect");
    }

    const tokens = await deps.refreshGoogle(
      connection.refresh_token,
      connection.oauth_client_key,
    );
    return {
      access_token: tokens.access_token,
      token_expires_at: deps.googleTokenExpiresAt(tokens.expires_in ?? 3600),
    };
  }

  async function ensureFreshAccessToken(
    supabase: SupabaseClient,
    connection: StoredConnection,
  ): Promise<string> {
    if (isAccessTokenFresh(connection)) {
      return connection.access_token;
    }

    return withConnectionRefreshLock(supabase, connection.id, async () => {
      if (deps.reloadConnection) {
        const latest = await deps.reloadConnection(
          supabase,
          connection.id,
          connection.provider,
        );
        if (latest && isAccessTokenFresh(latest)) {
          return latest.access_token;
        }
      }

      if (isAccessTokenFresh(connection)) {
        return connection.access_token;
      }

      try {
        const refreshed = await refreshProviderTokens(connection);
        await persistRefreshedTokens(supabase, connection, refreshed);
        return refreshed.access_token;
      } catch (error) {
        if (connection.provider === "google") {
          const message = error instanceof Error ? error.message : String(error);
          const normalized = message.toLowerCase();
          const reconnectRequired = [
            "unauthorized_client",
            "invalid_client",
            "invalid_grant",
            "expired or revoked",
            "invalid refresh token",
            "google_oauth_client_credentials_missing",
          ].some((marker) => normalized.includes(marker));
          await supabase
            .from(deps.getConnectionTable(connection.provider))
            .update({
              authorization_status: reconnectRequired ? "reauth_required" : "error",
              last_token_refresh_error: message.slice(0, 1000),
              last_token_refresh_error_code: reconnectRequired
                ? "oauth_reconnect_required"
                : "oauth_refresh_failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", connection.id);
        }
        throw error;
      }
    });
  }

  return { ensureFreshAccessToken, isAccessTokenFresh };
}

export type CredentialsService = ReturnType<typeof createCredentialsService>;

export { isAccessTokenFresh, withConnectionRefreshLock } from "./refresh-lock.js";
export type { StoredConnection, TokenRefreshDeps, RefreshedTokens } from "./types.js";
export {
  getActiveGoogleOAuthClientKey,
  refreshGoogleToken,
  resolveGoogleOAuthClient,
} from "./google-oauth.js";
export type { GoogleOAuthClient } from "./google-oauth.js";
