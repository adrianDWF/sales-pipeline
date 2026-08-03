import { describe, expect, it } from "vitest";

import {
  clampListLimit,
  DEFAULT_LIST_LIMIT,
  MAX_LIST_LIMIT,
} from "./pagination.js";

describe("clampListLimit", () => {
  it("uses default when limit is missing", () => {
    expect(clampListLimit()).toBe(DEFAULT_LIST_LIMIT);
    expect(clampListLimit(null)).toBe(DEFAULT_LIST_LIMIT);
  });

  it("clamps to max", () => {
    expect(clampListLimit(999)).toBe(MAX_LIST_LIMIT);
  });

  it("clamps to min of 1", () => {
    expect(clampListLimit(0)).toBe(1);
  });
});
