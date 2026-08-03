import { redirect } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireAdminProfile } from "@/lib/permissions";

export default async function AdminOverviewPage() {
  const admin = await requireAdminProfile();
  if (!admin) redirect("/dashboard");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ count: userCount }, { count: roleCount }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("app_roles").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Admin overview"
        description={`Workspace status${user?.email ? ` for ${user.email}` : ""}.`}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Team members</CardTitle>
            <CardDescription>Users with access to Sales Pipeline.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">{userCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Roles</CardTitle>
            <CardDescription>Custom permission roles configured.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">{roleCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
