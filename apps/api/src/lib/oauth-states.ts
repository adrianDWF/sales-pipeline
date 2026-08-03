import { randomBytes } from "node:crypto";

import type { IntegrationProvider, IntegrationService } from "@sales-pipeline/shared";
import { getConnectionProvider } from "@sales-pipeline/shared";

import { consumeOAuthStateToken, signOAuthStateToken } from "./auth.js";
import { createAdminClient } from "./supabase.js";

const STATE_TTL_MS = 10 * 60 * 1000;

export type ConsumedOAuthState = {
  userId: string;
  provider: IntegrationProvider;
  service: IntegrationService;
};

export async function createOAuthConnectState(
  userId: string,
  service: IntegrationService,
): Promise<string> {
  const provider = getConnectionProvider(service);
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + STATE_TTL_MS).toISOString();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("oauth_states")
    .insert({
      user_id: userId,
      provider,
      service,
      state_nonce: nonce,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create OAuth state");
  }

  return signOAuthStateToken({ stateId: data.id as string, nonce });
}

export async function consumeOAuthConnectState(
  stateToken: string,
): Promise<ConsumedOAuthState> {
  const { stateId, nonce } = await consumeOAuthStateToken(stateToken);
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("oauth_states")
    .select("id, user_id, provider, service, state_nonce, expires_at, consumed_at")
    .eq("id", stateId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("oauth_state_not_found");
  }

  if (data.consumed_at) {
    throw new Error("oauth_state_already_used");
  }

  if (data.state_nonce !== nonce) {
    throw new Error("oauth_state_invalid");
  }

  if (new Date(data.expires_at as string).getTime() < Date.now()) {
    throw new Error("oauth_state_expired");
  }

  const { error: updateError } = await admin
    .from("oauth_states")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", stateId)
    .is("consumed_at", null);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return {
    userId: data.user_id as string,
    provider: data.provider as IntegrationProvider,
    service: data.service as IntegrationService,
  };
}
