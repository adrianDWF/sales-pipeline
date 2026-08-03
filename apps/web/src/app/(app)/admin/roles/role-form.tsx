"use client";

import type { AppRole, PermissionKey, UserPermissions } from "@sales-pipeline/shared";
import {
  EMPTY_PERMISSIONS,
  PERMISSION_GROUPS,
  sanitizeRolePermissions,
} from "@sales-pipeline/shared";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { createRole, deleteRole, updateRole } from "@/app/(app)/admin/roles/actions";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type RoleFormProps = {
  mode: "create" | "edit";
  role?: AppRole;
};

export function RoleForm({ mode, role }: RoleFormProps) {
  const router = useRouter();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>(
    role ? sanitizeRolePermissions(role.permissions) : { ...EMPTY_PERMISSIONS },
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSystemRole = Boolean(role?.is_system);

  const breadcrumbs = useMemo(
    () =>
      mode === "create"
        ? "Members & Roles > Role management > Add new role"
        : `Members & Roles > Role management > ${role?.name ?? "Edit role"}`,
    [mode, role?.name],
  );

  function togglePermission(key: PermissionKey, enabled: boolean) {
    setPermissions((current) => ({
      ...current,
      [key]: enabled,
    }));
  }

  function toggleSectionPermissions(
    sectionPermissions: { key: PermissionKey }[],
    enabled: boolean,
  ) {
    setPermissions((current) => {
      const next = { ...current };
      for (const permission of sectionPermissions) {
        next[permission.key] = enabled;
      }
      return next;
    });
  }

  function handleSave() {
    setError(null);

    startTransition(async () => {
      try {
        const payload = {
          name,
          description,
          permissions: permissions as UserPermissions,
        };

        if (mode === "create") {
          await createRole(payload);
          router.push("/admin/roles");
          router.refresh();
          return;
        }

        if (!role) return;
        await updateRole(role.id, payload);
        router.push("/admin/roles");
        router.refresh();
      } catch (nextError) {
        setError(
          nextError instanceof Error ? nextError.message : "Unable to save role.",
        );
      }
    });
  }

  function handleDelete() {
    if (!role || role.is_system) return;

    setError(null);
    startTransition(async () => {
      try {
        await deleteRole(role.id);
        router.push("/admin/roles");
        router.refresh();
      } catch (nextError) {
        setError(
          nextError instanceof Error ? nextError.message : "Unable to delete role.",
        );
      }
    });
  }

  return (
    <div className="w-full space-y-8">
      <PageHeader
        eyebrow={breadcrumbs}
        title={mode === "create" ? "Add new role" : "Edit role"}
        description="Define what members with this role can access."
        actions={
          <>
            <Button variant="outline" asChild disabled={isPending}>
              <Link href="/admin/roles">Discard</Link>
            </Button>
            <Button onClick={handleSave} disabled={isPending || !name.trim()}>
              Save changes
            </Button>
          </>
        }
      />

      <section className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="role-name">Role name</Label>
          <Input
            id="role-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Super Admin"
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role-description">Description</Label>
          <Textarea
            id="role-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Manages system settings and user access, ensures system stability."
            className="min-h-28 text-sm"
          />
        </div>
      </section>

      <section className="space-y-8">
        <div>
          <h2 className="text-lg font-semibold">Permissions</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Choose what this role can access in the workspace.
          </p>
        </div>

        {PERMISSION_GROUPS.map((group) => {
          const allChecked = group.permissions.every(
            (permission) => permissions[permission.key],
          );

          return (
            <div key={group.id} className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium">{group.label}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {group.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    toggleSectionPermissions(group.permissions, !allChecked)
                  }
                  className="text-primary shrink-0 text-sm font-medium"
                >
                  Select all
                </button>
              </div>

              <div className="space-y-3 pl-1">
                {group.permissions.map((permission) => (
                  <label
                    key={permission.key}
                    className="flex items-center gap-3 text-sm"
                  >
                    <Checkbox
                      checked={permissions[permission.key]}
                      onCheckedChange={(enabled) =>
                        togglePermission(permission.key, enabled)
                      }
                    />
                    <span>{permission.label}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {isPending ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Saving role...
        </div>
      ) : null}

      {mode === "edit" && role && !role.is_system ? (
        <div className="border-t pt-6">
          <Button variant="outline" onClick={handleDelete} disabled={isPending}>
            Delete role
          </Button>
        </div>
      ) : null}

      {isSystemRole ? (
        <p className="text-muted-foreground text-sm">
          System roles can be edited, but they cannot be deleted.
        </p>
      ) : null}
    </div>
  );
}
