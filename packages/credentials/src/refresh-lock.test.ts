import { describe, expect, it } from "vitest";

import { isAccessTokenFresh } from "./refresh-lock.js";

describe("isAccessTokenFresh", () => {
  it("returns true when token expires beyond buffer", () => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    expect(
      isAccessTokenFresh({ access_token: "token", token_expires_at: expiresAt }),
    ).toBe(true);
  });

  it("returns false when token is near expiry", () => {
    const expiresAt = new Date(Date.now() + 60 * 1000).toISOString();
    expect(
      isAccessTokenFresh({ access_token: "token", token_expires_at: expiresAt }),
    ).toBe(false);
  });
});
