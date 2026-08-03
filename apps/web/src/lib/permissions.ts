import type { User } from "@supabase/supabase-js";
import type { AppRole, PermissionKey, Profile, UserPermissions } from "@sales-pipeline/shared";
import {
  hasPermission,
  resolveUserPermissions,
  UserRoleSchema,
} from "@sales-pipeline/shared";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

// Request-scoped so the shell layout, page permission guards, and profile loader
// all share a single `auth.getUser()` round-trip per navigation.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export type CurrentUserAccess = {
  profile: Profile;
  permissions: Record<PermissionKey, boolean>;
  isAdmin: boolean;
  assignedRoles: AppRole[];
};

async function getAssignedRoles(userId: string): Promise<AppRole[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("user_role_assignments")
    .select(
      `
      role:app_roles (
        id,
        name,
        slug,
        description,
        permissions,
        limits,
        is_system,
        created_at,
        updated_at
      )
    `,
    )
    .eq("user_id", userId);

  return (data ?? [])
    .map((row) => row.role)
    .flat()
    .filter(Boolean) as AppRole[];
}

export const getCurrentUserProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, role, is_system_admin, approval_status, permissions, preferred_locale, preferred_currency, created_at, updated_at",
    )
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  return {
    ...profile,
    email: profile.email ?? user.email ?? null,
    permissions: (profile.permissions ?? {}) as UserPermissions,
    role: UserRoleSchema.parse(profile.role),
    is_system_admin: Boolean(profile.is_system_admin),
    approval_status: profile.approval_status ?? "pending",
    preferred_locale: profile.preferred_locale === "en" ? "en" : "ro",
    preferred_currency: profile.preferred_currency ?? "RON",
  };
});

export const getCurrentUserAccess = cache(async (): Promise<CurrentUserAccess | null> => {
  const profile = await getCurrentUserProfile();
  if (!profile) {
    return null;
  }

  const assignedRoles = await getAssignedRoles(profile.id);
  const permissions = resolveUserPermissions(
    profile.role,
    profile.permissions,
    assignedRoles,
  );

  const isAdmin =
    profile.is_system_admin ||
    permissions.admin ||
    profile.role === "admin";

  if (profile.is_system_admin || profile.role === "admin") {
    permissions.dashboard = true;
    permissions.integrations = true;
    permissions.portfolio = true;
    permissions.admin = true;
    permissions.manual_sync = true;
    permissions.clients_view_all = true;
    permissions.clients_manage = true;
    permissions.seo_view = true;
    permissions.seo_manage = true;
    permissions.seo_manual_sync = true;
  }

  return {
    profile,
    permissions,
    isAdmin,
    assignedRoles,
  };
});

export async function requireAdminProfile(): Promise<Profile> {
  const access = await getCurrentUserAccess();
  if (!access?.isAdmin) {
    throw new Error("Admin access required");
  }

  return access.profile;
}

export async function requirePermission(key: PermissionKey): Promise<CurrentUserAccess> {
  const access = await getCurrentUserAccess();
  if (!access) {
    throw new Error("Authentication required");
  }

  if (
    !hasPermission(access.profile.role, access.profile.permissions, key, {
      isSystemAdmin: access.profile.is_system_admin,
      assignedRoles: access.assignedRoles,
    })
  ) {
    throw new Error(`Missing permission: ${key}`);
  }

  return access;
}

export function isSuperUser(access: CurrentUserAccess): boolean {
  return (
    access.profile.is_system_admin ||
    access.assignedRoles.some((role) => role.slug === "super-admin")
  );
}

export async function requireSuperUser(): Promise<CurrentUserAccess> {
  const access = await requirePermission("portfolio");
  if (!isSuperUser(access)) {
    throw new Error("Super user access required");
  }
  return access;
}
