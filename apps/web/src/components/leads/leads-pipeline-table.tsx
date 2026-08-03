"use client";

import type { LeadStatus, LeadWithAssignee } from "@sales-pipeline/shared";
import { getStageBadgeClass, getStageLabel } from "@sales-pipeline/shared";
import type { MRT_ColumnDef } from "material-react-table";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { DataTableMRT } from "@/components/common/data-table-mrt";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value: number | null | undefined, currency: string) {
  if (value == null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function initials(name: string | null | undefined, email: string | null | undefined) {
  const source = name?.trim() || email || "?";
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function LeadsPipelineTable({ leads }: { leads: LeadWithAssignee[] }) {
  const router = useRouter();

  const columns = useMemo<MRT_ColumnDef<LeadWithAssignee>[]>(
    () => [
      {
        accessorKey: "company",
        header: "Company details",
        size: 220,
        Cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.company || "—"}</p>
            <p className="text-muted-foreground truncate text-xs">
              {row.original.website_url || "—"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "name",
        header: "Contact",
        size: 200,
        Cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="text-muted-foreground truncate text-xs">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 160,
        Cell: ({ row }) => {
          const status = row.original.status as LeadStatus;
          return (
            <Badge
              variant="secondary"
              className={cn("capitalize", getStageBadgeClass(status))}
            >
              {getStageLabel(status)}
            </Badge>
          );
        },
      },
      {
        id: "owner",
        header: "Owner",
        size: 72,
        Cell: ({ row }) => {
          const assignee = row.original.assignee;
          if (!assignee) {
            return <span className="text-muted-foreground text-xs">—</span>;
          }
          return (
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">
                {initials(assignee.full_name, assignee.email)}
              </AvatarFallback>
            </Avatar>
          );
        },
      },
      {
        accessorKey: "updated_at",
        header: "Last update",
        size: 120,
        Cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.updated_at)}
          </span>
        ),
      },
      {
        id: "services",
        header: "Servicii",
        size: 80,
        Cell: ({ row }) => (
          <span className="text-muted-foreground text-sm tabular-nums">
            {row.original.services_count ?? 0}
          </span>
        ),
      },
      {
        id: "value",
        header: "Value",
        size: 110,
        Cell: ({ row }) => (
          <span className="text-sm font-medium tabular-nums">
            {formatMoney(row.original.deal_value, row.original.deal_currency)}
          </span>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Data lead",
        size: 120,
        Cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {formatDate(row.original.created_at)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <DataTableMRT
      columns={columns}
      data={leads}
      enableGlobalFilter
      emptyMessage="No leads match the current filters."
      muiTableBodyRowProps={({ row }) => ({
        onClick: () => router.push(`/leads/${row.original.id}`),
        sx: { cursor: "pointer" },
      })}
    />
  );
}
