import { redirect } from "next/navigation";

import {
  getEmailQuotaSummary,
  listAllRoles,
  listManagedUsers,
} from "@/app/(app)/admin/users/actions";
import { UsersTable } from "@/app/(app)/admin/users/users-table";
import { InviteUserSheet } from "@/app/(app)/admin/users/invite-user-sheet";
import { PageHeader } from "@/components/common/page-header";
import { getCurrentUserAccess } from "@/lib/permissions";

export default async function AdminUsersPage() {
  const access = await getCurrentUserAccess();

  if (!access) {
    redirect("/login?redirect=/admin/users");
  }

  if (!access.isAdmin) {
    redirect("/dashboard");
  }

  const [users, roles, emailQuota] = await Promise.all([
    listManagedUsers(),
    listAllRoles(),
    getEmailQuotaSummary(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Members & roles"
        title="Users"
        description="View team members, invite users, and assign roles."
        actions={<InviteUserSheet roles={roles} />}
      />

      <UsersTable users={users} roles={roles} emailQuota={emailQuota} />
    </div>
  );
}
