import { afterEach, describe, expect, it } from "vitest";

import {
  getActiveGoogleOAuthClientKey,
  resolveGoogleOAuthClient,
} from "./google-oauth.js";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("Google OAuth credential broker", () => {
  it("uses the current production credential version by default", () => {
    delete process.env.GOOGLE_OAUTH_ACTIVE_CLIENT_KEY;
    expect(getActiveGoogleOAuthClientKey()).toBe("google-production-v2");
  });

  it("resolves the active client from the backwards-compatible environment", () => {
    process.env.GOOGLE_OAUTH_ACTIVE_CLIENT_KEY = "production-v2";
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    delete process.env.GOOGLE_OAUTH_CLIENTS_JSON;

    expect(getActiveGoogleOAuthClientKey()).toBe("production-v2");
    expect(resolveGoogleOAuthClient("production-v2")).toEqual({
      key: "production-v2",
      clientId: "client-id",
      clientSecret: "client-secret",
    });
  });

  it("resolves historical clients from the versioned registry", () => {
    process.env.GOOGLE_OAUTH_ACTIVE_CLIENT_KEY = "production-v2";
    process.env.GOOGLE_OAUTH_CLIENTS_JSON = JSON.stringify({
      "production-v1": {
        clientId: "old-client-id",
        clientSecret: "old-client-secret",
      },
    });

    expect(resolveGoogleOAuthClient("production-v1")).toMatchObject({
      key: "production-v1",
      clientId: "old-client-id",
    });
  });

  it("fails explicitly when a connection references an unknown client", () => {
    process.env.GOOGLE_OAUTH_ACTIVE_CLIENT_KEY = "production-v2";
    process.env.GOOGLE_CLIENT_ID = "client-id";
    process.env.GOOGLE_CLIENT_SECRET = "client-secret";
    delete process.env.GOOGLE_OAUTH_CLIENTS_JSON;

    expect(() => resolveGoogleOAuthClient("production-v1")).toThrow(
      "google_oauth_client_credentials_missing:production-v1",
    );
  });
});
