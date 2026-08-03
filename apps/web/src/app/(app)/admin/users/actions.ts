"use server";

import type { AppRole, ApprovalStatus, ManagedUser } from "@sales-pipeline/shared";
import {
  AppRoleSchema,
  ApprovalStatusSchema,
  clampListLimit,
  InviteUserSchema,
  MAX_LIST_LIMIT,
} from "@sales-pipeline/shared";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import {
  sendAccountApprovedEmail,
  sendAccountRejectedEmail,
  sendUserInviteEmail,
} from "@/lib/email";
import {
  assertCanSendEmail,
  getEmailQuotaSummary,
  isEmailConfigured,
} from "@/lib/email-quota";
import { requireAdminProfile } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export { getEmailQuotaSummary };

function parseRole(row: AppRole): AppRole {
  return AppRoleSchema.parse(row);
}

async function getRequestAppUrl() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  if (origin) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const adminProfile = await requireAdminProfile();
  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, is_system_admin, approval_status, approval_reviewed_at, created_at, updated_at",
    )
    .order("created_at", { ascending: true })
    .limit(clampListLimit(MAX_LIST_LIMIT));

  if (error) {
    throw new Error(error.message);
  }

  const { data: assignments, error: assignmentError } = await supabase
    .from("user_role_assignments")
    .select(
      `
      id,
      user_id,
      role_id,
      assigned_by,
      created_at,
      role:app_roles (
        id,
        name,
        slug,
        description,
        permissions,
        is_system,
        created_at,
        updated_at
      )
    `,
    )
    .limit(clampListLimit(MAX_LIST_LIMIT) * 5);

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const assignerIds = [
    ...new Set(
      (assignments ?? [])
        .map((assignment) => assignment.assigned_by)
        .filter(Boolean),
    ),
  ] as string[];

  const { data: assigners } = assignerIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", assignerIds)
    : { data: [] };

  const assignerMap = new Map(
    (assigners ?? []).map((assigner) => [assigner.id, assigner]),
  );

  return (profiles ?? []).map((profile) => {
    const userAssignments =
      assignments?.filter((assignment) => assignment.user_id === profile.id) ?? [];

    const roles = userAssignments
      .map((assignment) => assignment.role)
      .filter(Boolean)
      .map((role) => parseRole(role as unknown as AppRole));

    return {
      ...profile,
      is_system_admin: Boolean(profile.is_system_admin),
      approval_status: ApprovalStatusSchema.parse(profile.approval_status),
      approval_reviewed_at: profile.approval_reviewed_at ?? null,
      roles,
      assignments: userAssignments.map((assignment) => ({
        id: assignment.id,
        user_id: assignment.user_id,
        role_id: assignment.role_id,
        assigned_by: assignment.assigned_by,
        created_at: assignment.created_at,
        role: assignment.role
          ? parseRole(assignment.role as unknown as AppRole)
          : undefined,
        assigned_by_profile: assignment.assigned_by
          ? assignerMap.get(assignment.assigned_by)
          : assignment.assigned_by === adminProfile.id
            ? {
                full_name: adminProfile.full_name,
                email: adminProfile.email,
              }
            : undefined,
      })),
    };
  });
}

export async function listAllRoles(): Promise<AppRole[]> {
  await requireAdminProfile();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("app_roles")
    .select("*")
    .order("is_system", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((role) => parseRole(role as AppRole));
}

export async function updateUserRoles(userId: string, roleIds: string[]) {
  const adminProfile = await requireAdminProfile();
  const supabase = await createClient();

  const { data: targetProfile, error: profileError } = await supabase
    .from("profiles")
    .select("is_system_admin")
    .eq("id", userId)
    .single();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { data: currentAssignments, error: readError } = await supabase
    .from("user_role_assignments")
    .select("id, role_id, role:app_roles (slug)")
    .eq("user_id", userId);

  if (readError) {
    throw new Error(readError.message);
  }

  const currentRoleIds = new Set(
    (currentAssignments ?? []).map((assignment) => assignment.role_id),
  );
  const nextRoleIds = new Set(roleIds);

  if (
    targetProfile.is_system_admin &&
    !(currentAssignments ?? []).some((assignment) => nextRoleIds.has(assignment.role_id))
  ) {
    throw new Error("System admin must keep at least one assigned role.");
  }

  const toRemove =
    currentAssignments?.filter((assignment) => !nextRoleIds.has(assignment.role_id)) ??
    [];
  const toAdd = roleIds.filter((roleId) => !currentRoleIds.has(roleId));

  if (toRemove.length > 0) {
    const { error } = await supabase
      .from("user_role_assignments")
      .delete()
      .in(
        "id",
        toRemove.map((assignment) => assignment.id),
      );

    if (error) {
      throw new Error(error.message);
    }
  }

  if (toAdd.length > 0) {
    const { error } = await supabase.from("user_role_assignments").insert(
      toAdd.map((roleId) => ({
        user_id: userId,
        role_id: roleId,
        assigned_by: adminProfile.id,
      })),
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/roles");
  revalidatePath("/leads");
  revalidatePath("/dashboard");
}

export async function inviteUser(formData: FormData) {
  const adminProfile = await requireAdminProfile();

  const parsed = InviteUserSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    role_id: formData.get("role_id"),
  });

  if (!parsed.success) {
    throw new Error("Invalid invite details");
  }

  const { full_name, email, role_id } = parsed.data;

  if (isEmailConfigured()) {
    await assertCanSendEmail();
  }

  const admin = createAdminClient();
  const appUrl = await getRequestAppUrl();

  const { data: inviteData, error: inviteError } =
    await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name },
      redirectTo: `${appUrl}/auth/callback`,
    });

  if (inviteError) {
    throw new Error(inviteError.message);
  }

  const userId = inviteData.user?.id;
  if (!userId) {
    throw new Error("Invite succeeded but user id missing");
  }

  const { error: profileUpdateError } = await admin
    .from("profiles")
    .update({
      full_name,
      email,
      approval_status: "pending" satisfies ApprovalStatus,
    })
    .eq("id", userId);
  if (profileUpdateError) {
    throw new Error(profileUpdateError.message);
  }

  const { error: deleteAssignmentsError } = await admin
    .from("user_role_assignments")
    .delete()
    .eq("user_id", userId);
  if (deleteAssignmentsError) {
    throw new Error(deleteAssignmentsError.message);
  }

  const { error: insertAssignmentError } = await admin
    .from("user_role_assignments")
    .insert({
    user_id: userId,
    role_id,
    assigned_by: adminProfile.id,
  });
  if (insertAssignmentError) {
    throw new Error(insertAssignmentError.message);
  }

  if (isEmailConfigured()) {
    await sendUserInviteEmail({ to: email, name: full_name });
  }

  revalidatePath("/admin/users");
}

export async function approveUserAccount(userId: string) {
  const adminProfile = await requireAdminProfile();
  const supabase = await createClient();

  const { data: targetProfile, error: readError } = await supabase
    .from("profiles")
    .select("id, full_name, email, approval_status")
    .eq("id", userId)
    .single();

  if (readError) {
    throw new Error(readError.message);
  }

  if (targetProfile.approval_status === "approved") {
    return;
  }

  if (targetProfile.email && isEmailConfigured()) {
    await assertCanSendEmail();
    await sendAccountApprovedEmail({
      to: targetProfile.email,
      name: targetProfile.full_name,
    });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      approval_status: "approved" satisfies ApprovalStatus,
      approval_reviewed_at: new Date().toISOString(),
      approval_reviewed_by: adminProfile.id,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  const { count: roleCount } = await supabase
    .from("user_role_assignments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if ((roleCount ?? 0) === 0) {
    const { data: staffRole } = await supabase
      .from("app_roles")
      .select("id")
      .eq("slug", "staff")
      .single();

    if (staffRole) {
      await supabase.from("user_role_assignments").insert({
        user_id: userId,
        role_id: staffRole.id,
        assigned_by: adminProfile.id,
      });
    }
  }

  revalidatePath("/admin/users");
}

export async function rejectUserAccount(userId: string) {
  const adminProfile = await requireAdminProfile();
  const supabase = await createClient();

  const { data: targetProfile, error: readError } = await supabase
    .from("profiles")
    .select("id, full_name, email, approval_status, is_system_admin")
    .eq("id", userId)
    .single();

  if (readError) {
    throw new Error(readError.message);
  }

  if (targetProfile.is_system_admin) {
    throw new Error("System admin accounts cannot be rejected.");
  }

  if (targetProfile.email && isEmailConfigured()) {
    await assertCanSendEmail();
    await sendAccountRejectedEmail({
      to: targetProfile.email,
      name: targetProfile.full_name,
    });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      approval_status: "rejected" satisfies ApprovalStatus,
      approval_reviewed_at: new Date().toISOString(),
      approval_reviewed_by: adminProfile.id,
    })
    .eq("id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/users");
}
