import { Suspense } from "react";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import { LeadsWorkspace } from "@/components/leads/leads-workspace";
import {
  getAssignableUsers,
  getLeadFacets,
  getLeadsForUser,
  getPipelineKpis,
} from "@/lib/leads";
import { getCurrentUserAccess } from "@/lib/permissions";

export default async function LeadsPage() {
  const access = await getCurrentUserAccess();
  if (!access) redirect("/login?redirect=/leads");
  if (!access.permissions.portfolio) redirect("/permission-approval");

  const [leads, assignableUsers, facets, kpis] = await Promise.all([
    getLeadsForUser(access),
    getAssignableUsers(),
    getLeadFacets(access),
    getPipelineKpis(access),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pipeline"
        description="Sales modules · leads from website and manual entry."
      />

      <Suspense fallback={<div className="bg-muted/40 h-96 animate-pulse rounded-xl" />}>
        <LeadsWorkspace
          leads={leads}
          users={assignableUsers}
          facets={facets}
          kpis={kpis}
        />
      </Suspense>
    </div>
  );
}
