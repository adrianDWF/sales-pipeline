"use client";

import type { RoleWithMembers } from "@sales-pipeline/shared";
import { ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/common/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUserInitials } from "@/lib/user";

function getRoleIcon(slug: string) {
  if (slug === "super-admin") {
    return (
      <div className="flex size-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <ShieldCheck className="size-5" />
      </div>
    );
  }

  return (
    <div className="flex size-11 items-center justify-center rounded-full bg-sky-100 text-sky-700">
      <UserRound className="size-5" />
    </div>
  );
}

export function RoleGrid({ roles }: { roles: RoleWithMembers[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {roles.map((role) => (
        <Link key={role.id} href={`/admin/roles/${role.id}`}>
          <Card className="hover:border-foreground/20 h-full transition-colors">
            <CardHeader className="space-y-4">
              <div className="flex items-start gap-3">
                {getRoleIcon(role.slug)}
                <div className="min-w-0">
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                  {role.is_system ? (
                    <Badge variant="secondary" className="mt-2 rounded-full">
                      Default role
                    </Badge>
                  ) : null}
                </div>
              </div>
              <CardDescription className="line-clamp-3 text-sm leading-relaxed">
                {role.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {role.members.slice(0, 4).map((member) => {
                    const label =
                      member.full_name?.trim() || member.email || "User";

                    return (
                      <Avatar
                        key={member.id}
                        className="border-background size-8 border-2"
                      >
                        <AvatarFallback className="text-[10px]">
                          {getUserInitials(label)}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })}
                </div>
                {role.member_count > 4 ? (
                  <span className="text-muted-foreground text-sm">
                    +{role.member_count - 4}
                  </span>
                ) : role.member_count === 0 ? (
                  <span className="text-muted-foreground text-sm">No members</span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function RoleManagementHeader() {
  return (
    <PageHeader
      eyebrow="Members & Roles"
      title="Role management"
      description="Define permissions and assign roles to workspace members."
      actions={
        <Button asChild>
          <Link href="/admin/roles/new">+ Add new role</Link>
        </Button>
      }
    />
  );
}
