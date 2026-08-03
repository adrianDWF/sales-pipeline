import { describe, expect, it } from "vitest";

import { isApiErrorResponse } from "@sales-pipeline/shared";

describe("shared api-response", () => {
  it("detects api error shape", () => {
    expect(isApiErrorResponse({ message: "forbidden" })).toBe(true);
    expect(isApiErrorResponse({ error: "nope" })).toBe(false);
  });
});
