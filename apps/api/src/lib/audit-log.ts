import { createAdminClient } from "./supabase.js";

export type AuditAction =
  | "integration.oauth_started"
  | "integration.oauth_completed"
  | "integration.oauth_failed"
  | "integration.page_speed_url_added"
  | "integration.crux_history_url_added"
  | "integration.seo_connected"
  | "integration.cms_connected"
  | "integration.cms_published"
  | "integration.token_refreshed"
  | "integration.token_refresh_failed"
  | "integration.disconnected"
  | "sync.started"
  | "sync.failed";

const SENSITIVE_METADATA_KEYS = new Set([
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "jwt",
  "secret",
  "password",
  "code",
]);

export function sanitizeAuditMetadata(
  metadata: Record<string, unknown> = {},
): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_METADATA_KEYS.has(key.toLowerCase())) {
      continue;
    }
    if (typeof value === "string" && value.length > 500) {
      safe[key] = `${value.slice(0, 120)}…`;
      continue;
    }
    safe[key] = value;
  }
  return safe;
}

export async function writeAuditLog(entry: {
  userId?: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      user_id: entry.userId ?? null,
      action: entry.action,
      resource_type: entry.entityType ?? null,
      resource_id: entry.entityId ?? null,
      metadata: sanitizeAuditMetadata(entry.metadata),
    });
  } catch {
    // Audit logging must not break primary flows.
  }
}
