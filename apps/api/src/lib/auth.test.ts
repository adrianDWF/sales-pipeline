import { afterEach, describe, expect, it } from "vitest";

import { consumeOAuthStateToken, signOAuthStateToken } from "./auth.js";

const ORIGINAL_SECRET = process.env.OAUTH_STATE_SECRET;

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.OAUTH_STATE_SECRET;
  } else {
    process.env.OAUTH_STATE_SECRET = ORIGINAL_SECRET;
  }
});

describe("OAuth state token", () => {
  it("signs and verifies a state payload", async () => {
    process.env.OAUTH_STATE_SECRET = "test-oauth-state-secret-min-32-chars!!";

    const token = await signOAuthStateToken({
      stateId: "11111111-1111-1111-1111-111111111111",
      nonce: "abc123",
    });

    const payload = await consumeOAuthStateToken(token);
    expect(payload).toEqual({
      stateId: "11111111-1111-1111-1111-111111111111",
      nonce: "abc123",
    });
  });

  it("rejects tampered signatures", async () => {
    process.env.OAUTH_STATE_SECRET = "test-oauth-state-secret-min-32-chars!!";

    const token = await signOAuthStateToken({
      stateId: "11111111-1111-1111-1111-111111111111",
      nonce: "abc123",
    });
    const [payload] = token.split(".");
    const tampered = `${payload}.invalid-signature`;

    await expect(consumeOAuthStateToken(tampered)).rejects.toThrow("oauth_state_invalid");
  });

  it("rejects malformed tokens", async () => {
    process.env.OAUTH_STATE_SECRET = "test-oauth-state-secret-min-32-chars!!";

    await expect(consumeOAuthStateToken("not-a-valid-token")).rejects.toThrow(
      "oauth_state_invalid",
    );
  });
});
