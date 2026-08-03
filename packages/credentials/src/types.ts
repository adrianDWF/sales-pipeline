import type { IntegrationProvider } from "@sales-pipeline/shared";

export type StoredConnection = {
  id: string;
  user_id: string;
  service: string;
  account_email: string;
  site_url: string | null;
  property_id: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  metadata: Record<string, unknown>;
  oauth_client_key?: string | null;
  authorization_status?: string | null;
  provider: IntegrationProvider;
};

export type RefreshedTokens = {
  access_token: string;
  refresh_token?: string | null;
  expires_in?: number;
};

export type TokenRefreshDeps = {
  getConnectionTable: (provider: IntegrationProvider) => string;
  encryptToken: (value: string | null) => string | null;
  refreshGoogle: (
    refreshToken: string,
    oauthClientKey?: string | null,
  ) => Promise<RefreshedTokens>;
  refreshMeta: (accessToken: string) => Promise<RefreshedTokens>;
  refreshTiktok: (refreshToken: string) => Promise<RefreshedTokens>;
  refreshTiktokOrganic: (refreshToken: string) => Promise<RefreshedTokens>;
  googleTokenExpiresAt: (expiresIn: number) => string;
  metaTokenExpiresAt: (expiresIn: number) => string;
  tiktokTokenExpiresAt: (expiresIn: number) => string;
  reloadConnection?: (
    supabase: import("@supabase/supabase-js").SupabaseClient,
    connectionId: string,
    provider: IntegrationProvider,
  ) => Promise<StoredConnection | null>;
};
