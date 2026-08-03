"use client";

import type { AppRole, EmailQuotaSummary, ManagedUser } from "@sales-pipeline/shared";
import { AlertTriangle, Ban, Check, Loader2, MoreHorizontal, Search, X } from "lucide-react";
import type { MRT_ColumnDef } from "material-react-table";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";

import {
  approveUserAccount,
  rejectUserAccount,
  updateUserRoles,
} from "@/app/(app)/admin/users/actions";
import { DataTableMRT } from "@/components/common/data-table-mrt";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getUserInitials } from "@/lib/user";

type UsersTab = "approved" | "pending";

function getDisplayName(user: ManagedUser) {
  return user.full_name?.trim() || user.email || "Unnamed user";
}

function getRoleBadgeClass(slug: string) {
  if (slug === "super-admin") {
    return "bg-violet-100 text-violet-700 hover:bg-violet-100";
  }
  if (slug === "client") {
    return "bg-blue-100 text-blue-700 hover:bg-blue-100";
  }
  if (slug === "manager") {
    return "bg-teal-100 text-teal-700 hover:bg-teal-100";
  }
  return "bg-muted text-foreground hover:bg-muted";
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getLatestAssignment(user: ManagedUser) {
  return [...user.assignments].sort(
    (a, b) =>
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime(),
  )[0];
}

export function UsersTable({
  users,
  roles,
  emailQuota,
}: {
  users: ManagedUser[];
  roles: AppRole[];
  emailQuota: EmailQuotaSummary;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<UsersTab>("approved");
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const approvedUsers = useMemo(
    () => users.filter((user) => user.approval_status === "approved"),
    [users],
  );

  const pendingUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.approval_status === "pending" ||
          user.approval_status === "pending_on_hold",
      ),
    [users],
  );

  const actionsBlocked = emailQuota.isExceeded;

  const activeUsers = tab === "approved" ? approvedUsers : pendingUsers;

  const filteredUsers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return activeUsers;

    return activeUsers.filter((user) => {
      const haystack = [
        user.full_name ?? "",
        user.email ?? "",
        ...user.roles.map((role) => role.name),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [activeUsers, query]);

  const openUserActions = useCallback((user: ManagedUser) => {
    setSelectedUser(user);
    setSelectedRoleIds(user.roles.map((role) => role.id));
    setError(null);
  }, []);

  function toggleRole(roleId: string, enabled: boolean) {
    setSelectedRoleIds((current) =>
      enabled ? [...new Set([...current, roleId])] : current.filter((id) => id !== roleId),
    );
  }

  function handleSaveRoles() {
    if (!selectedUser) return;

    setError(null);
    startTransition(async () => {
      try {
        await updateUserRoles(selectedUser.id, selectedRoleIds);
        setSelectedUser(null);
        router.refresh();
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to update user roles.",
        );
      }
    });
  }

  const handleApprove = useCallback((userId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await approveUserAccount(userId);
        router.refresh();
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to approve user.",
        );
      }
    });
  }, [router]);

  const handleReject = useCallback((userId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await rejectUserAccount(userId);
        router.refresh();
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to reject user.",
        );
      }
    });
  }, [router]);

  const columns = useMemo<MRT_ColumnDef<ManagedUser>[]>(
    () =>
      tab === "approved"
        ? [
            {
              accessorFn: (user) => getDisplayName(user),
              id: "user",
              header: "User",
              minSize: 260,
              size: 320,
              Cell: ({ row }) => {
                const name = getDisplayName(row.original);

                return (
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback>{getUserInitials(name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium">{name}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {row.original.email ?? "No email"}
                      </p>
                    </div>
                  </div>
                );
              },
            },
            {
              accessorFn: (user) => user.roles.map((role) => role.name).join(", "),
              id: "roles",
              header: "Permission",
              minSize: 220,
              Cell: ({ row }) => (
                <div className="flex flex-wrap gap-2">
                  {row.original.roles.length > 0 ? (
                    row.original.roles.map((role) => (
                      <Badge
                        key={role.id}
                        variant="secondary"
                        className={getRoleBadgeClass(role.slug)}
                      >
                        {role.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">No roles</span>
                  )}
                </div>
              ),
            },
            {
              accessorFn: (user) => {
                const latestAssignment = getLatestAssignment(user);
                return (
                  latestAssignment?.assigned_by_profile?.full_name ||
                  latestAssignment?.assigned_by_profile?.email ||
                  (latestAssignment ? "Admin" : "—")
                );
              },
              id: "assignedBy",
              header: "Assigned by",
              minSize: 180,
            },
            {
              accessorFn: (user) => {
                const latestAssignment = getLatestAssignment(user);
                return latestAssignment
                  ? formatDate(latestAssignment.created_at)
                  : formatDate(user.created_at);
              },
              id: "assignedDate",
              header: "Assigned date",
              minSize: 160,
            },
            {
              accessorFn: (user) => getDisplayName(user),
              id: "actions",
              header: "Action",
              enableColumnActions: false,
              enableHiding: false,
              enableSorting: false,
              meta: { align: "right" },
              size: 84,
              Cell: ({ row }) => {
                const name = getDisplayName(row.original);

                return (
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openUserActions(row.original)}
                      aria-label={`Manage roles for ${name}`}
                    >
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </div>
                );
              },
            },
          ]
        : [
            {
              accessorFn: (user) => getDisplayName(user),
              id: "user",
              header: "User",
              minSize: 260,
              size: 320,
              Cell: ({ row }) => {
                const name = getDisplayName(row.original);

                return (
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback>{getUserInitials(name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium">{name}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {row.original.email ?? "No email"}
                      </p>
                    </div>
                  </div>
                );
              },
            },
            {
              accessorFn: (user) => formatDate(user.created_at),
              id: "requested",
              header: "Requested",
              minSize: 160,
            },
            {
              accessorFn: (user) => user.approval_status,
              id: "actions",
              header: "Actions",
              enableColumnActions: false,
              enableHiding: false,
              enableSorting: false,
              meta: { align: "right" },
              minSize: 220,
              Cell: ({ row }) => (
                <div className="flex flex-col items-end gap-2">
                  {row.original.approval_status === "pending_on_hold" ? (
                    <Badge variant="secondary" className="rounded-full">
                      On hold - email limit
                    </Badge>
                  ) : null}
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(row.original.id)}
                      disabled={isPending || actionsBlocked}
                    >
                      <Check className="size-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(row.original.id)}
                      disabled={isPending || actionsBlocked}
                    >
                      <X className="size-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              ),
            },
          ],
    [actionsBlocked, handleApprove, handleReject, isPending, openUserActions, tab],
  );

  return (
    <>
      <div className="space-y-4">
        {emailQuota.isExceeded ? (
          <div className="border-destructive/30 bg-destructive/10 text-destructive flex gap-3 rounded-xl border px-4 py-3 text-sm">
            <Ban className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Monthly email limit reached</p>
              <p className="mt-1 opacity-90">
                You have sent {emailQuota.sent.toLocaleString()} of{" "}
                {emailQuota.limit.toLocaleString()} emails this month. Approve and
                reject actions are paused until the quota resets. New sign-ups are
                placed on hold automatically.
              </p>
            </div>
          </div>
        ) : emailQuota.isNearLimit ? (
          <div className="flex gap-3 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Approaching monthly email limit</p>
              <p className="mt-1 opacity-90">
                {emailQuota.remaining.toLocaleString()} emails remaining this month
                ({emailQuota.sent.toLocaleString()} / {emailQuota.limit.toLocaleString()}{" "}
                used). Approval actions still work while quota remains.
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="bg-muted/40 inline-flex rounded-lg p-1">
            {(["approved", "pending"] as UsersTab[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={cn(
                  "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                  tab === item
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item === "approved" ? "Approved" : "Pending"}
                <span className="text-muted-foreground ml-2 text-xs">
                  {item === "approved" ? approvedUsers.length : pendingUsers.length}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-md">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users"
              className="pl-9"
            />
          </div>
        </div>

        {error ? <p className="text-destructive text-sm">{error}</p> : null}

        <DataTableMRT
          key={tab}
          columns={columns}
          data={filteredUsers}
          emptyMessage={
            tab === "approved"
              ? "No approved users found."
              : "No pending approval requests."
          }
          getRowId={(row) => row.id}
          initialState={{
            columnPinning: { left: ["user"] },
            pagination: { pageIndex: 0, pageSize: 10 },
          }}
          tableOptions={{
            enableBottomToolbar: filteredUsers.length > 10,
            enableTopToolbar: false,
          }}
        />
      </div>

      <Sheet
        open={Boolean(selectedUser)}
        onOpenChange={(open) => {
          if (!open) setSelectedUser(null);
        }}
      >
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Manage roles</SheetTitle>
            <SheetDescription>
              {selectedUser
                ? `Choose which roles apply to ${getDisplayName(selectedUser)}.`
                : "Choose roles for this user."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 px-4 pb-6">
            {roles.map((role) => {
              const checked = selectedRoleIds.includes(role.id);

              return (
                <label
                  key={role.id}
                  className="hover:bg-muted/60 flex items-start gap-3 rounded-xl border p-4"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(enabled) => toggleRole(role.id, enabled)}
                    disabled={isPending}
                  />
                  <div>
                    <p className="font-medium">{role.name}</p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {role.description}
                    </p>
                  </div>
                </label>
              );
            })}

            {error ? <p className="text-destructive text-sm">{error}</p> : null}

            <Button
              className="w-full"
              onClick={handleSaveRoles}
              disabled={isPending || selectedRoleIds.length === 0}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save roles"
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
