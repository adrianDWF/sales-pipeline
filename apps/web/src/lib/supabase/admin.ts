/**
 * SERVER ONLY — never import into client components.
 * Uses SUPABASE_SERVICE_ROLE_KEY for privileged admin operations (invites, etc.).
 */
import { createClient } from "@supabase/supabase-js";

function assertServerOnly() {
  if (typeof window !== "undefined") {
    throw new Error("createAdminClient() must not run in the browser");
  }
}

export function createAdminClient() {
  assertServerOnly();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase admin credentials");
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
