import { redirect } from "next/navigation";

import { listRolesWithMembers } from "@/app/(app)/admin/roles/actions";
import { RoleGrid, RoleManagementHeader } from "@/app/(app)/admin/roles/role-grid";
import { getCurrentUserAccess } from "@/lib/permissions";

export default async function AdminRolesPage() {
  const access = await getCurrentUserAccess();

  if (!access) {
    redirect("/login?redirect=/admin/roles");
  }

  if (!access.isAdmin) {
    redirect("/dashboard");
  }

  const roles = await listRolesWithMembers();

  return (
    <div className="space-y-5">
      <RoleManagementHeader />
      <RoleGrid roles={roles} />
    </div>
  );
}
