import { afterEach, describe, expect, it } from "vitest";

import { isAuthorizedCronRequest } from "./cron-auth.js";

describe("isAuthorizedCronRequest", () => {
  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("accepts a matching bearer token", () => {
    process.env.CRON_SECRET = "cron-secret-minimum-32-characters";
    expect(isAuthorizedCronRequest("Bearer cron-secret-minimum-32-characters")).toBe(true);
  });

  it("rejects missing or wrong tokens", () => {
    process.env.CRON_SECRET = "cron-secret-minimum-32-characters";
    expect(isAuthorizedCronRequest(undefined)).toBe(false);
    expect(isAuthorizedCronRequest("Bearer wrong")).toBe(false);
  });

  it("rejects when CRON_SECRET is not configured", () => {
    expect(isAuthorizedCronRequest("Bearer anything")).toBe(false);
  });
});
