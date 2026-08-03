import { redirect } from "next/navigation";

import { RoleForm } from "@/app/(app)/admin/roles/role-form";
import { getCurrentUserAccess } from "@/lib/permissions";

export default async function NewRolePage() {
  const access = await getCurrentUserAccess();

  if (!access) {
    redirect("/login?redirect=/admin/roles/new");
  }

  if (!access.isAdmin) {
    redirect("/dashboard");
  }

  return <RoleForm mode="create" />;
}
