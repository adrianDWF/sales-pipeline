import type { PermissionKey } from "@sales-pipeline/shared";
import { mergeRolePermissions } from "@sales-pipeline/shared";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function userHasPermission(
  supabase: SupabaseClient,
  userId: string,
  key: PermissionKey,
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_system_admin, role")
    .eq("id", userId)
    .single();

  if (profile?.is_system_admin || profile?.role === "admin") {
    return true;
  }

  const { data: assignments } = await supabase
    .from("user_role_assignments")
    .select("role:app_roles (permissions)")
    .eq("user_id", userId);

  const roles = (assignments ?? [])
    .map((row) => row.role)
    .flat()
    .filter(Boolean) as Array<{ permissions?: Record<string, boolean> }>;

  if (roles.length === 0) {
    return false;
  }

  return mergeRolePermissions(roles as Parameters<typeof mergeRolePermissions>[0])[key];
}
