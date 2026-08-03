"use server";

import type { AppRole, PermissionKey, RoleWithMembers, UserPermissions } from "@sales-pipeline/shared";
import {
  AppRoleSchema,
  clampListLimit,
  MAX_LIST_LIMIT,
  sanitizeRolePermissions,
  slugifyRoleName,
} from "@sales-pipeline/shared";
import { revalidatePath } from "next/cache";

import { requireAdminProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

function parseRole(row: AppRole): AppRole {
  return AppRoleSchema.parse({
    ...row,
    permissions: (row.permissions ?? {}) as UserPermissions,
  });
}

export async function listRolesWithMembers(): Promise<RoleWithMembers[]> {
  await requireAdminProfile();
  const supabase = await createClient();

  const listLimit = clampListLimit(MAX_LIST_LIMIT);

  const { data: roles, error } = await supabase
    .from("app_roles")
    .select("*")
    .order("is_system", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(listLimit);

  if (error) {
    throw new Error(error.message);
  }

  const { data: assignments } = await supabase
    .from("user_role_assignments")
    .select("role_id, user_id")
    .limit(listLimit * 5);

  const { data: memberProfiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .limit(listLimit * 5);

  return (roles ?? []).map((role) => {
    const memberIds = new Set(
      (assignments ?? [])
        .filter((assignment) => assignment.role_id === role.id)
        .map((assignment) => assignment.user_id),
    );

    const members =
      memberProfiles?.filter((profile) => memberIds.has(profile.id)) ?? [];

    return {
      ...parseRole(role as AppRole),
      member_count: members.length,
      members: members as RoleWithMembers["members"],
    };
  });
}

export async function getRoleById(roleId: string): Promise<AppRole | null> {
  await requireAdminProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("app_roles")
    .select("*")
    .eq("id", roleId)
    .single();

  if (error) {
    return null;
  }

  return parseRole(data as AppRole);
}

export async function createRole(input: {
  name: string;
  description: string;
  permissions: UserPermissions;
}) {
  await requireAdminProfile();
  const supabase = await createClient();
  const slug = slugifyRoleName(input.name);

  if (!slug) {
    throw new Error("Role name must contain letters or numbers.");
  }

  const { error } = await supabase.from("app_roles").insert({
    name: input.name.trim(),
    slug,
    description: input.description.trim(),
    permissions: sanitizeRolePermissions(input.permissions),
    is_system: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/roles");
}

export async function updateRole(
  roleId: string,
  input: {
    name: string;
    description: string;
    permissions: UserPermissions;
  },
) {
  await requireAdminProfile();
  const supabase = await createClient();

  const { data: role, error: readError } = await supabase
    .from("app_roles")
    .select("is_system, slug")
    .eq("id", roleId)
    .single();

  if (readError) {
    throw new Error(readError.message);
  }

  const payload: {
    name: string;
    description: string;
    permissions: Record<PermissionKey, boolean>;
    slug?: string;
  } = {
    name: input.name.trim(),
    description: input.description.trim(),
    permissions: sanitizeRolePermissions(input.permissions),
  };

  if (!role.is_system) {
    payload.slug = slugifyRoleName(input.name);
  }

  const { error } = await supabase
    .from("app_roles")
    .update(payload)
    .eq("id", roleId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/roles");
  revalidatePath(`/admin/roles/${roleId}`);
  revalidatePath("/admin/users");
}

export async function deleteRole(roleId: string) {
  await requireAdminProfile();
  const supabase = await createClient();

  const { error } = await supabase
    .from("app_roles")
    .delete()
    .eq("id", roleId)
    .eq("is_system", false);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/roles");
  revalidatePath("/admin/users");
}
