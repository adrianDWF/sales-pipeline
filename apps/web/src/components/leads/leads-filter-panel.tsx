"use client";

import type { LeadStatus } from "@sales-pipeline/shared";
import { LEAD_PIPELINE_STAGES } from "@sales-pipeline/shared";
import { cn } from "@/lib/utils";

import type { AssignableUser, LeadFacets } from "@/lib/leads";

export type LeadStatusFilter = LeadStatus | "all" | "new_lead_unassigned";

type OwnerFilter = "all" | "unassigned" | string;

export function LeadsFilterPanel({
  users,
  facets,
  ownerFilter,
  statusFilter,
  onOwnerChange,
  onStatusChange,
}: {
  users: AssignableUser[];
  facets: LeadFacets;
  ownerFilter: OwnerFilter;
  statusFilter: LeadStatusFilter;
  onOwnerChange: (value: OwnerFilter) => void;
  onStatusChange: (value: LeadStatusFilter) => void;
}) {
  const totalLeads = Object.values(facets.byStatus).reduce((a, b) => a + b, 0);

  return (
    <aside className="bg-card border-border flex w-full shrink-0 flex-col gap-6 rounded-xl border p-3 md:w-60 md:p-4">
      <div>
        <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
          Echipa sales
        </p>
        <ul className="space-y-0.5">
          <FilterRow
            label="All Sales"
            count={totalLeads}
            active={ownerFilter === "all"}
            onClick={() => onOwnerChange("all")}
          />
          {users.map((user) => (
            <FilterRow
              key={user.id}
              label={user.full_name?.trim() || user.email || "User"}
              count={facets.byOwner[user.id] ?? 0}
              active={ownerFilter === user.id}
              onClick={() => onOwnerChange(user.id)}
            />
          ))}
          <FilterRow
            label="No owner"
            count={facets.unassigned}
            active={ownerFilter === "unassigned"}
            onClick={() => onOwnerChange("unassigned")}
          />
        </ul>
      </div>

      <div>
        <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
          Status
        </p>
        <ul className="space-y-0.5">
          <FilterRow
            label="All Leads"
            count={totalLeads}
            active={statusFilter === "all"}
            onClick={() => onStatusChange("all")}
          />
          {LEAD_PIPELINE_STAGES.filter((s) => s.status !== "lost").map((stage) => (
            <FilterRow
              key={stage.status}
              label={stage.labelRo}
              count={facets.byStatus[stage.status] ?? 0}
              active={statusFilter === stage.status}
              onClick={() => onStatusChange(stage.status)}
            />
          ))}
          <FilterRow
            label="New lead & no owner"
            count={facets.newLeadUnassigned}
            active={statusFilter === "new_lead_unassigned"}
            onClick={() => onStatusChange("new_lead_unassigned")}
          />
          <FilterRow
            label="Lost"
            count={facets.byStatus.lost ?? 0}
            active={statusFilter === "lost"}
            onClick={() => onStatusChange("lost")}
          />
        </ul>
      </div>
    </aside>
  );
}

function FilterRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
          active
            ? "bg-primary/10 text-primary font-medium"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        <span className="truncate pr-2">{label}</span>
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{count}</span>
      </button>
    </li>
  );
}
