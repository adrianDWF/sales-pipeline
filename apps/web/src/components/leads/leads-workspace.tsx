"use client";

import type { LeadWithAssignee, PipelineKpis } from "@sales-pipeline/shared";
import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import {
  LeadsFilterPanel,
  type LeadStatusFilter,
} from "@/components/leads/leads-filter-panel";
import { LeadsKpiRow } from "@/components/leads/leads-kpi-row";
import { LeadsPipelineTable } from "@/components/leads/leads-pipeline-table";
import { Button } from "@/components/ui/button";
import type { AssignableUser, LeadFacets } from "@/lib/leads";

export function LeadsWorkspace({
  leads,
  users,
  facets,
  kpis,
}: {
  leads: LeadWithAssignee[];
  users: AssignableUser[];
  facets: LeadFacets;
  kpis: PipelineKpis;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [addOpen, setAddOpen] = useState(false);

  const ownerFilter = searchParams.get("owner") ?? "all";
  const statusFilter = (searchParams.get("status") ?? "all") as LeadStatusFilter;

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const ownerOk =
        ownerFilter === "all" ||
        (ownerFilter === "unassigned" && !lead.assigned_to) ||
        lead.assigned_to === ownerFilter;
      const statusOk =
        statusFilter === "all" ||
        (statusFilter === "new_lead_unassigned"
          ? lead.status === "new_lead" && !lead.assigned_to
          : lead.status === statusFilter);
      return ownerOk && statusOk;
    });
  }, [leads, ownerFilter, statusFilter]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <LeadsFilterPanel
        users={users}
        facets={facets}
        ownerFilter={ownerFilter}
        statusFilter={statusFilter}
        onOwnerChange={(value) => setParam("owner", value)}
        onStatusChange={(value) => setParam("status", value)}
      />

      <div className="min-w-0 flex-1 space-y-4">
        <LeadsKpiRow kpis={kpis} />

        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Lead Management</h2>
            <p className="text-muted-foreground text-sm">Status · {filteredLeads.length} leads</p>
          </div>
          <Button type="button" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" />
            Adaugă lead
          </Button>
        </div>

        <LeadsPipelineTable leads={filteredLeads} />
      </div>

      <AddLeadDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
