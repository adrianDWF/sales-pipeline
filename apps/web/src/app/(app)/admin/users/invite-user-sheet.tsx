"use client";

import type { AppRole } from "@sales-pipeline/shared";
import { Loader2, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { inviteUser } from "@/app/(app)/admin/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function InviteUserSheet({ roles }: { roles: AppRole[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedRoleId, setSelectedRoleId] = useState(
    roles.find((r) => r.slug === "client")?.id ?? roles[0]?.id ?? "",
  );

  useEffect(() => {
    if (!roles.length) return;
    setSelectedRoleId((current) => {
      if (current && roles.some((role) => role.id === current)) {
        return current;
      }
      return roles.find((r) => r.slug === "client")?.id ?? roles[0]?.id ?? "";
    });
  }, [roles]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <UserPlus className="mr-2 size-4" />
        Invite user
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Invite user</SheetTitle>
            <SheetDescription>
              Send an invite email so the user can set their password and join the
              workspace.
            </SheetDescription>
          </SheetHeader>

          <form
            className="mt-6 space-y-4"
            action={(formData) => {
              setError(null);
              startTransition(async () => {
                try {
                  await inviteUser(formData);
                  setOpen(false);
                  router.refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Invite failed");
                }
              });
            }}
          >
            <div className="space-y-1">
              <Label htmlFor="invite-name">Full name</Label>
              <Input id="invite-name" name="full_name" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="invite-email">Email</Label>
              <Input id="invite-email" name="email" type="email" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="invite-role">Role</Label>
              <input type="hidden" name="role_id" value={selectedRoleId} />
              <Select
                value={selectedRoleId}
                onValueChange={setSelectedRoleId}
              >
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Send invite
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
