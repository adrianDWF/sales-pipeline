import { randomBytes } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

const STATE_TTL_MS = 10 * 60 * 1000;
const GMAIL_SERVICE = "gmail";

export type SignedOAuthStatePayload = {
  stateId: string;
  nonce: string;
};

type SignedOAuthStateWire = SignedOAuthStatePayload & {
  exp: number;
};

function getStateSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) {
    throw new Error("Missing OAUTH_STATE_SECRET");
  }
  return secret;
}

export async function signOAuthStateToken(
  payload: SignedOAuthStatePayload,
): Promise<string> {
  const secret = getStateSecret();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const wire: SignedOAuthStateWire = {
    ...payload,
    exp: Date.now() + STATE_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(wire)).toString("base64url");
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(encodedPayload));
  const sig = Buffer.from(signature).toString("base64url");

  return `${encodedPayload}.${sig}`;
}

export async function consumeOAuthStateToken(
  state: string,
): Promise<SignedOAuthStatePayload> {
  const secret = getStateSecret();
  const [payload, sig] = state.split(".");
  if (!payload || !sig) {
    throw new Error("oauth_state_invalid");
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    Buffer.from(sig, "base64url"),
    encoder.encode(payload),
  );

  if (!valid) {
    throw new Error("oauth_state_invalid");
  }

  const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as SignedOAuthStateWire;

  if (Date.now() > data.exp) {
    throw new Error("oauth_state_expired");
  }

  return {
    stateId: data.stateId,
    nonce: data.nonce,
  };
}

export async function createGmailOAuthState(
  userId: string,
  redirectPath: string,
): Promise<string> {
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + STATE_TTL_MS).toISOString();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("oauth_states")
    .insert({
      user_id: userId,
      provider: "google",
      service: GMAIL_SERVICE,
      state_nonce: nonce,
      redirect_path: redirectPath,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create OAuth state");
  }

  return signOAuthStateToken({ stateId: data.id as string, nonce });
}

export async function consumeGmailOAuthState(stateToken: string): Promise<{
  userId: string;
  redirectPath: string;
}> {
  const { stateId, nonce } = await consumeOAuthStateToken(stateToken);
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("oauth_states")
    .select("id, user_id, provider, service, state_nonce, redirect_path, expires_at, consumed_at")
    .eq("id", stateId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("oauth_state_not_found");
  }

  if (data.provider !== "google" || data.service !== GMAIL_SERVICE) {
    throw new Error("oauth_state_invalid");
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
    redirectPath: (data.redirect_path as string) || "/leads",
  };
}
