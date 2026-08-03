import { redirect } from "next/navigation";

import { PageHeader } from "@/components/common/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getLeadSummaryForUser } from "@/lib/leads";
import { getCurrentUserAccess } from "@/lib/permissions";

export default async function DashboardPage() {
  const access = await getCurrentUserAccess();
  if (!access) redirect("/login?redirect=/dashboard");
  if (!access.permissions.dashboard) redirect("/permission-approval");

  const summary = access.permissions.portfolio
    ? await getLeadSummaryForUser(access)
    : { new: 0, inProgress: 0, won: 0 };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Overview of your sales pipeline."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">New leads</CardTitle>
            <CardDescription>Submitted via website form</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">{summary.new}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">In progress</CardTitle>
            <CardDescription>Contacted or qualified</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">{summary.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Won</CardTitle>
            <CardDescription>Closed successfully</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tracking-tight">{summary.won}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
