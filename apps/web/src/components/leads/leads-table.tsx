"use client";

import type { LeadStatus, LeadWithAssignee } from "@sales-pipeline/shared";
import { LEAD_STATUSES } from "@sales-pipeline/shared";
import { Loader2, UserPlus } from "lucide-react";
import type { MRT_ColumnDef } from "material-react-table";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import {
  assignLeadToMeAction,
  updateLeadAction,
} from "@/app/(app)/leads/actions";
import { DataTableMRT } from "@/components/common/data-table-mrt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { AssignableUser } from "@/lib/leads";
import { cn } from "@/lib/utils";

function statusBadgeClass(status: LeadStatus) {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "contacted":
      return "bg-amber-100 text-amber-800 hover:bg-amber-100";
    case "qualified":
      return "bg-violet-100 text-violet-800 hover:bg-violet-100";
    case "won":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "lost":
      return "bg-muted text-muted-foreground hover:bg-muted";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function assigneeLabel(lead: LeadWithAssignee) {
  if (!lead.assignee) return "Unassigned";
  return lead.assignee.full_name?.trim() || lead.assignee.email || "Unknown";
}

export function LeadsTable({
  leads,
  assignableUsers,
  canManageAll,
  currentUserId,
}: {
  leads: LeadWithAssignee[];
  assignableUsers: AssignableUser[];
  canManageAll: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<LeadWithAssignee | null>(null);
  const [status, setStatus] = useState<LeadStatus>("new");
  const [assignedTo, setAssignedTo] = useState<string>("unassigned");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const columns = useMemo<MRT_ColumnDef<LeadWithAssignee>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 180,
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 220,
      },
      {
        accessorKey: "company",
        header: "Company",
        size: 160,
        Cell: ({ row }) => row.original.company || "—",
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        Cell: ({ row }) => (
          <Badge className={cn("capitalize", statusBadgeClass(row.original.status))}>
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: "assignee",
        header: "Assigned to",
        size: 160,
        accessorFn: (row) => assigneeLabel(row),
      },
      {
        accessorKey: "source",
        header: "Source",
        size: 100,
      },
      {
        accessorKey: "created_at",
        header: "Submitted",
        size: 160,
        Cell: ({ row }) => formatDate(row.original.created_at),
      },
    ],
    [],
  );

  function openLead(lead: LeadWithAssignee) {
    setSelected(lead);
    setStatus(lead.status);
    setAssignedTo(lead.assigned_to ?? "unassigned");
    setNotes(lead.notes ?? "");
    setError(null);
  }

  function saveLead() {
    if (!selected) return;
    startTransition(async () => {
      const result = await updateLeadAction(selected.id, {
        status,
        assigned_to: assignedTo === "unassigned" ? null : assignedTo,
        notes: notes.trim() || null,
      });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setSelected(null);
      router.refresh();
    });
  }

  function claimLead(leadId: string) {
    startTransition(async () => {
      const result = await assignLeadToMeAction(leadId);
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      setSelected(null);
      router.refresh();
    });
  }

  const canEditSelected =
    selected &&
    (canManageAll ||
      selected.assigned_to === currentUserId ||
      selected.assigned_to === null);

  return (
    <>
      <DataTableMRT
        columns={columns}
        data={leads}
        emptyMessage="No leads yet. Submissions from your website form will appear here."
        enableGlobalFilter
        muiTableBodyRowProps={({ row }) => ({
          onClick: () => openLead(row.original),
          sx: { cursor: "pointer" },
        })}
      />

      <Sheet open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>
                  {selected.email}
                  {selected.company ? ` · ${selected.company}` : ""}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Submitted:</span>{" "}
                    {formatDate(selected.created_at)}
                  </p>
                  {selected.phone ? (
                    <p>
                      <span className="text-muted-foreground">Phone:</span> {selected.phone}
                    </p>
                  ) : null}
                  {selected.message ? (
                    <div>
                      <p className="text-muted-foreground mb-1">Message</p>
                      <p className="bg-muted/50 rounded-lg border p-3 whitespace-pre-wrap">
                        {selected.message}
                      </p>
                    </div>
                  ) : null}
                </div>

                {!selected.assigned_to ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isPending}
                    onClick={() => claimLead(selected.id)}
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UserPlus className="size-4" />
                    )}
                    Assign to me
                  </Button>
                ) : null}

                {canEditSelected ? (
                  <div className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={status}
                        onValueChange={(value) => setStatus(value as LeadStatus)}
                        disabled={isPending}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUSES.map((item) => (
                            <SelectItem key={item} value={item} className="capitalize">
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {canManageAll ? (
                      <div className="space-y-2">
                        <Label>Assigned to</Label>
                        <Select
                          value={assignedTo}
                          onValueChange={setAssignedTo}
                          disabled={isPending}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {assignableUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.full_name?.trim() || user.email || user.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        disabled={isPending}
                        placeholder="Internal notes for the team…"
                      />
                    </div>

                    {error ? <p className="text-destructive text-sm">{error}</p> : null}

                    <Button
                      type="button"
                      className="w-full"
                      disabled={isPending}
                      onClick={saveLead}
                    >
                      {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                      Save changes
                    </Button>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
