import { createAdminClient } from "./supabase.js";

export async function pingSupabase(): Promise<{ ok: true; checkedAt: string }> {
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").select("id", { head: true, count: "exact" });

  if (error) {
    throw new Error(`Supabase keep-alive failed: ${error.message}`);
  }

  return { ok: true, checkedAt: new Date().toISOString() };
}
