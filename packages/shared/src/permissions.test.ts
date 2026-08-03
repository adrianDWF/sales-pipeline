import { describe, expect, it } from "vitest";

import { mergeRolePermissions } from "./index.js";

describe("mergeRolePermissions", () => {
  it("merges permissions with OR semantics across roles", () => {
    const merged = mergeRolePermissions([
      { permissions: { portfolio: true, admin: false } },
      { permissions: { admin: true, manual_sync: true } },
    ]);

    expect(merged.portfolio).toBe(true);
    expect(merged.admin).toBe(true);
    expect(merged.manual_sync).toBe(true);
    expect(merged.integrations).toBe(false);
  });

  it("returns all false when no roles grant permissions", () => {
    const merged = mergeRolePermissions([
      { permissions: {} },
      { permissions: { dashboard: false } },
    ]);

    expect(merged.dashboard).toBe(false);
    expect(merged.clients_manage).toBe(false);
    expect(merged.seo_view).toBe(false);
  });
});
