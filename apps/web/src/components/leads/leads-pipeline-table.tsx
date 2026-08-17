"use client";

import type { LeadStatus, LeadWithAssignee } from "@sales-pipeline/shared";
import { getStageBadgeClass, getStageLabel } from "@sales-pipeline/shared";
import { format } from "date-fns";
import type { MRT_ColumnDef } from "material-react-table";
import {
  Calendar,
  CalendarPlus,
  FileText,
  Loader2,
  PiggyBank,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";

import { assignLeadToMeAction } from "@/app/(app)/leads/actions";
import { DataTableMRT } from "@/components/common/data-table-mrt";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { companyFaviconUrl, companyInitials } from "@/lib/company-brand";
import { cn } from "@/lib/utils";

/** 8-column grid: company + contact get 2 units each; others get ~1 unit. */
const LEAD_COLUMN_WEIGHT = {
  company: 2,
  contact: 2,
  status: 1.1,
  owner: 1,
  updatedAt: 1.15,
  services: 1,
  value: 1.05,
  createdAt: 1.15,
} as const;

function formatTableDate(value: string) {
  return format(new Date(value), "d MMM, yyyy");
}

function formatMoney(value: number | null | undefined, currency: string) {
  if (value == null) return null;
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

function CompanyCell({ lead }: { lead: LeadWithAssignee }) {
  const label = lead.company?.trim() || lead.name;
  const favicon = companyFaviconUrl(lead.website_url);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-10 rounded-lg">
        {favicon ? <AvatarImage src={favicon} alt={label} className="rounded-lg" /> : null}
        <AvatarFallback className="rounded-lg text-xs font-semibold">
          {companyInitials(lead.company, lead.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium">{label}</p>
        {lead.website_url ? (
          <p className="truncate text-xs text-blue-600">{lead.website_url}</p>
        ) : (
          <p className="text-muted-foreground truncate text-xs">—</p>
        )}
      </div>
    </div>
  );
}

function OwnerCell({ lead }: { lead: LeadWithAssignee }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const assignee = lead.assignee;

  if (assignee) {
    return (
      <Avatar className="size-8">
        <AvatarFallback className="text-xs">
          {initials(assignee.full_name, assignee.email)}
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="size-8 rounded-full"
      disabled={isPending}
      aria-label="Assign lead to me"
      onClick={(event) => {
        event.stopPropagation();
        startTransition(async () => {
          await assignLeadToMeAction(lead.id);
          router.refresh();
        });
      }}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <UserPlus className="size-4" />
      )}
    </Button>
  );
}

export function LeadsPipelineTable({ leads }: { leads: LeadWithAssignee[] }) {
  const router = useRouter();

  const columns = useMemo<MRT_ColumnDef<LeadWithAssignee>[]>(
    () => [
      {
        accessorKey: "company",
        header: "Company details",
        size: 240,
        meta: { fluidWeight: LEAD_COLUMN_WEIGHT.company },
        Cell: ({ row }) => <CompanyCell lead={row.original} />,
      },
      {
        accessorKey: "name",
        header: "Contact",
        size: 200,
        meta: { fluidWeight: LEAD_COLUMN_WEIGHT.contact },
        Cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.name}</p>
            <p className="truncate text-xs text-blue-600">({row.original.email})</p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 160,
        meta: { fluidWeight: LEAD_COLUMN_WEIGHT.status },
        Cell: ({ row }) => {
          const status = row.original.status as LeadStatus;
          return (
            <Badge
              variant="secondary"
              className={cn("rounded-full capitalize", getStageBadgeClass(status))}
            >
              {getStageLabel(status)}
            </Badge>
          );
        },
      },
      {
        id: "owner",
        header: "Owner",
        size: 80,
        meta: { fluidWeight: LEAD_COLUMN_WEIGHT.owner },
        Cell: ({ row }) => <OwnerCell lead={row.original} />,
      },
      {
        accessorKey: "updated_at",
        header: "Last update",
        size: 140,
        meta: { fluidWeight: LEAD_COLUMN_WEIGHT.updatedAt },
        Cell: ({ row }) => (
          <Badge
            variant="outline"
            className="rounded-full border-blue-100 bg-blue-50 font-normal text-blue-700"
          >
            <Calendar className="size-3.5" />
            {formatTableDate(row.original.updated_at)}
          </Badge>
        ),
      },
      {
        id: "services",
        header: "Servicii",
        size: 100,
        meta: { fluidWeight: LEAD_COLUMN_WEIGHT.services },
        Cell: ({ row }) => (
          <Badge
            variant="outline"
            className="rounded-full border-green-100 bg-green-50 font-normal text-green-700"
          >
            <FileText className="size-3.5" />
            {row.original.services_count ?? 0}
          </Badge>
        ),
      },
      {
        id: "value",
        header: "Value",
        size: 120,
        meta: { fluidWeight: LEAD_COLUMN_WEIGHT.value },
        Cell: ({ row }) => {
          const formatted = formatMoney(row.original.deal_value, row.original.deal_currency);
          if (!formatted) {
            return <span className="text-muted-foreground text-sm">—</span>;
          }
          return (
            <Badge
              variant="outline"
              className="rounded-full border-teal-100 bg-teal-50 font-normal text-teal-700"
            >
              <PiggyBank className="size-3.5" />
              {formatted}
            </Badge>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "Data lead",
        size: 140,
        meta: { fluidWeight: LEAD_COLUMN_WEIGHT.createdAt },
        Cell: ({ row }) => (
          <Badge
            variant="outline"
            className="rounded-full border-orange-100 bg-orange-50 font-normal text-orange-700"
          >
            <CalendarPlus className="size-3.5" />
            {formatTableDate(row.original.created_at)}
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <div className="w-full min-w-0">
      <DataTableMRT
        columns={columns}
        data={leads}
        enableGlobalFilter
        fluidColumnsUntil={8}
        fluidLayoutMinWidth={1200}
        emptyMessage="No leads match the current filters."
        muiTableBodyRowProps={({ row }) => ({
          onClick: () => router.push(`/leads/${row.original.id}`),
          sx: { cursor: "pointer" },
        })}
      />
    </div>
  );
}
