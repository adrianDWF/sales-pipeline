import { redirect } from "next/navigation";

import { LeadsTable } from "@/components/leads/leads-table";
import { PageHeader } from "@/components/common/page-header";
import { getAssignableUsers, getLeadsForUser } from "@/lib/leads";
import { getCurrentUserAccess } from "@/lib/permissions";

export default async function LeadsPage() {
  const access = await getCurrentUserAccess();
  if (!access) redirect("/login?redirect=/leads");
  if (!access.permissions.portfolio) redirect("/permission-approval");

  const [leads, assignableUsers] = await Promise.all([
    getLeadsForUser(access),
    access.permissions.clients_manage ? getAssignableUsers() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leads"
        description="Website form submissions and assigned follow-ups."
      />

      <LeadsTable
        leads={leads}
        assignableUsers={assignableUsers}
        canManageAll={access.permissions.clients_manage}
        currentUserId={access.profile.id}
      />
    </div>
  );
}
