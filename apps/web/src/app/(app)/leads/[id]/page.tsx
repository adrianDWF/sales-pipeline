import { notFound, redirect } from "next/navigation";

import { LeadProfileView } from "@/components/leads/lead-profile-view";
import { getAssignableUsers, getLeadById } from "@/lib/leads";
import { getCurrentUserAccess, isSuperUser } from "@/lib/permissions";

export default async function LeadProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await getCurrentUserAccess();
  if (!access) redirect("/login?redirect=/leads");
  if (!access.permissions.portfolio) redirect("/permission-approval");

  const [lead, assignableUsers] = await Promise.all([
    getLeadById(id),
    access.permissions.clients_manage ? getAssignableUsers() : Promise.resolve([]),
  ]);

  if (!lead) notFound();

  return (
    <LeadProfileView
      lead={lead}
      assignableUsers={assignableUsers}
      canManageAll={access.permissions.clients_manage}
      currentUserId={access.profile.id}
      isSuperUser={isSuperUser(access)}
    />
  );
}
