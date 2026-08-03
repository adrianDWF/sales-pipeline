import "../env.js";

import { createRemoteJWKSet, jwtVerify } from "jose";

function getJWKS() {
  const baseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!baseUrl) {
    throw new Error("Missing Supabase URL");
  }

  const jwksUrl = new URL("/auth/v1/.well-known/jwks.json", baseUrl);
  return createRemoteJWKSet(jwksUrl);
}

export function getBearerToken(header: string | undefined): string | null {
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice(7);
}

export async function verifySupabaseToken(token: string) {
  const baseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const { payload } = await jwtVerify(token, getJWKS(), {
    issuer: `${baseUrl}/auth/v1`,
  });

  const userId = payload.sub;
  if (!userId) {
    throw new Error("Invalid token: missing subject");
  }

  return { userId, email: payload.email as string | undefined };
}

export type SignedOAuthStatePayload = {
  stateId: string;
  nonce: string;
};

function getStateSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) {
    throw new Error("Missing OAUTH_STATE_SECRET");
  }
  return secret;
}

type SignedOAuthStateWire = SignedOAuthStatePayload & {
  exp: number;
};

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
    exp: Date.now() + 600_000,
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

/** @deprecated Use signOAuthStateToken via createOAuthConnectState instead. */
export async function signOAuthState(state: {
  userId: string;
  service: string;
  userToken: string;
}): Promise<string> {
  void state;
  throw new Error("Legacy OAuth state signing is disabled");
}

/** @deprecated Use consumeOAuthConnectState instead. */
export async function verifyOAuthState(state: string): Promise<{
  userId: string;
  service: string;
  userToken: string;
}> {
  void state;
  throw new Error("Legacy OAuth state verification is disabled");
}
