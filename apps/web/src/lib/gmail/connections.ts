import { refreshGoogleToken } from "@sales-pipeline/credentials";

import { decryptTokenField, encryptTokenField } from "@/lib/crypto";
import { createAdminClient } from "@/lib/supabase/admin";

import { isExcludedGmailEmail } from "./config";
import type { GmailMessage } from "./message-parser";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const TOKEN_REFRESH_BUFFER_MS = 60_000;

export type StoredGmailConnection = {
  user_id: string;
  google_email: string;
  refresh_token_encrypted: string;
  access_token_encrypted: string | null;
  token_expires_at: string | null;
};

export async function getTeamGmailSummary() {
  const admin = createAdminClient();
  const [{ data: profiles, error: profilesError }, { data: connections, error: connectionsError }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, full_name, email")
        .eq("approval_status", "approved"),
      admin.from("user_gmail_connections").select("user_id, google_email, connected_at"),
    ]);

  if (profilesError) {
    throw new Error(profilesError.message);
  }
  if (connectionsError) {
    throw new Error(connectionsError.message);
  }

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id as string, profile]),
  );
  const connectedUserIds = new Set(
    (connections ?? []).map((connection) => connection.user_id as string),
  );

  const connected = (connections ?? [])
    .filter((connection) => !isExcludedGmailEmail(connection.google_email as string))
    .map((connection) => {
      const profile = profileById.get(connection.user_id as string);
      return {
        userId: connection.user_id as string,
        fullName: (profile?.full_name as string | null) ?? null,
        googleEmail: connection.google_email as string,
        connectedAt: connection.connected_at as string,
      };
    })
    .sort((a, b) => a.fullName?.localeCompare(b.fullName ?? "") ?? 0);

  const pending = (profiles ?? [])
    .filter((profile) => {
      const email = profile.email as string | null;
      if (!email || isExcludedGmailEmail(email)) return false;
      return !connectedUserIds.has(profile.id as string);
    })
    .map((profile) => ({
      userId: profile.id as string,
      fullName: (profile.full_name as string | null) ?? null,
      email: profile.email as string,
    }))
    .sort((a, b) => a.fullName?.localeCompare(b.fullName ?? "") ?? 0);

  return { connected, pending };
}

export async function listTeamGmailConnections(): Promise<StoredGmailConnection[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_gmail_connections")
    .select(
      "user_id, google_email, refresh_token_encrypted, access_token_encrypted, token_expires_at",
    );

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).filter(
    (row) => !isExcludedGmailEmail(row.google_email as string),
  ) as StoredGmailConnection[];
}

export async function getGmailConnectionForUser(userId: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_gmail_connections")
    .select("user_id, google_email, connected_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function persistRefreshedTokens(
  userId: string,
  tokens: {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  },
  existingRefreshEncrypted: string,
) {
  const admin = createAdminClient();
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : new Date(Date.now() + 3600 * 1000).toISOString();

  const refreshEncrypted =
    tokens.refresh_token !== undefined
      ? encryptTokenField(tokens.refresh_token)
      : existingRefreshEncrypted;

  const { error } = await admin
    .from("user_gmail_connections")
    .update({
      access_token_encrypted: encryptTokenField(tokens.access_token),
      refresh_token_encrypted: refreshEncrypted,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getValidGmailAccessToken(
  connection: StoredGmailConnection,
): Promise<string> {
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0;
  const accessToken = decryptTokenField(connection.access_token_encrypted);

  if (accessToken && expiresAt - Date.now() > TOKEN_REFRESH_BUFFER_MS) {
    return accessToken;
  }

  const refreshToken = decryptTokenField(connection.refresh_token_encrypted);
  if (!refreshToken) {
    throw new Error("Gmail refresh token missing");
  }

  const refreshed = await refreshGoogleToken(refreshToken);
  await persistRefreshedTokens(connection.user_id, refreshed, connection.refresh_token_encrypted);

  return refreshed.access_token;
}

async function gmailFetch<T>(accessToken: string, path: string): Promise<T> {
  const response = await fetch(`${GMAIL_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gmail API ${path} failed (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}

export async function searchGmailMessages(
  accessToken: string,
  query: string,
  maxResults = 50,
): Promise<string[]> {
  const params = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
  });

  const data = await gmailFetch<{ messages?: { id: string }[] }>(
    accessToken,
    `/messages?${params.toString()}`,
  );

  return (data.messages ?? []).map((message) => message.id);
}

export async function getGmailMessage(
  accessToken: string,
  messageId: string,
): Promise<GmailMessage> {
  return gmailFetch<GmailMessage>(
    accessToken,
    `/messages/${messageId}?format=full`,
  );
}

export async function upsertGmailConnection(input: {
  userId: string;
  googleEmail: string;
  refreshToken: string;
  accessToken: string;
  expiresIn?: number;
  scopes: string[];
}) {
  const admin = createAdminClient();
  const tokenExpiresAt = input.expiresIn
    ? new Date(Date.now() + input.expiresIn * 1000).toISOString()
    : new Date(Date.now() + 3600 * 1000).toISOString();

  const { error } = await admin.from("user_gmail_connections").upsert(
    {
      user_id: input.userId,
      google_email: input.googleEmail.toLowerCase(),
      refresh_token_encrypted: encryptTokenField(input.refreshToken),
      access_token_encrypted: encryptTokenField(input.accessToken),
      token_expires_at: tokenExpiresAt,
      scopes: input.scopes,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new Error(error.message);
  }
}
