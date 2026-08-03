import { describe, expect, it } from "vitest";

import { toOAuthRedirectError } from "./oauth-errors.js";

describe("toOAuthRedirectError", () => {
  it("preserves the actionable Tag Manager API error", () => {
    expect(toOAuthRedirectError(new Error("tag_manager_api_disabled"))).toBe(
      "tag_manager_api_disabled",
    );
  });

  it.each([
    "google_business_api_disabled",
    "google_business_api_access_denied",
  ])("preserves the actionable Google Business error %s", (code) => {
    expect(toOAuthRedirectError(new Error(code))).toBe(code);
  });

  it("hides unknown provider errors", () => {
    expect(toOAuthRedirectError(new Error("provider response details"))).toBe(
      "oauth_failed",
    );
  });
});
