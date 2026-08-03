import { describe, expect, it } from "vitest";

import { getSafeErrorMessage } from "./api-response.js";

describe("getSafeErrorMessage", () => {
  it("returns safe snake_case codes from Error messages", () => {
    expect(getSafeErrorMessage(new Error("oauth_state_expired"))).toBe(
      "oauth_state_expired",
    );
    expect(getSafeErrorMessage(new Error("forbidden"))).toBe("forbidden");
  });

  it("replaces raw or unsafe messages with fallback", () => {
    expect(getSafeErrorMessage(new Error("Connection refused to db.internal"))).toBe(
      "internal_server_error",
    );
    expect(getSafeErrorMessage(new Error("Invalid token: missing subject"))).toBe(
      "internal_server_error",
    );
    expect(getSafeErrorMessage(new Error("Has Spaces"))).toBe("internal_server_error");
  });

  it("uses custom fallback for non-Error values and empty messages", () => {
    expect(getSafeErrorMessage(null, "auth_failed")).toBe("auth_failed");
    expect(getSafeErrorMessage(new Error(""), "auth_failed")).toBe("auth_failed");
    expect(getSafeErrorMessage(new Error("   "), "auth_failed")).toBe("auth_failed");
  });
});
