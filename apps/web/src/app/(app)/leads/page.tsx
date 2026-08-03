import { redirect } from "next/navigation";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { getCurrentUserAccess } from "@/lib/permissions";

export default async function LeadsPage() {
  const access = await getCurrentUserAccess();
  if (!access) redirect("/login?redirect=/leads");
  if (!access.permissions.portfolio) redirect("/permission-approval");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leads"
        description="Manage leads collected from your website form. Full list and assignment flows arrive in Phase 1."
      />

      <EmptyState
        title="No leads yet"
        description="Once the form webhook and database are connected, new submissions will show up here."
      />
    </div>
  );
}
