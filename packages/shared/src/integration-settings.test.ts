import { describe, expect, it } from "vitest";

import { DisconnectIntegrationAccountSchema } from "./index.js";

describe("DisconnectIntegrationAccountSchema", () => {
  it("accepts and trims an account identifier", () => {
    expect(
      DisconnectIntegrationAccountSchema.parse({
        accountEmail: "  account@example.com  ",
      }),
    ).toEqual({ accountEmail: "account@example.com" });
  });

  it("rejects empty and excessively long identifiers", () => {
    expect(
      DisconnectIntegrationAccountSchema.safeParse({ accountEmail: "  " }).success,
    ).toBe(false);
    expect(
      DisconnectIntegrationAccountSchema.safeParse({
        accountEmail: "a".repeat(321),
      }).success,
    ).toBe(false);
  });
});
