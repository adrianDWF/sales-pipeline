import { redirect } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUserAccess } from "@/lib/permissions";

export default async function DashboardPage() {
  const access = await getCurrentUserAccess();
  if (!access) redirect("/login?redirect=/dashboard");
  if (!access.permissions.dashboard) redirect("/permission-approval");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Overview of your sales pipeline. Lead metrics will appear here once form ingestion is connected."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">New leads</CardTitle>
            <CardDescription>Submitted via website form</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">—</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">In progress</CardTitle>
            <CardDescription>Leads being worked by the team</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">—</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Won</CardTitle>
            <CardDescription>Closed successfully</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">—</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
