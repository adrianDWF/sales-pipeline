import { notFound, redirect } from "next/navigation";

import { getRoleById } from "@/app/(app)/admin/roles/actions";
import { RoleForm } from "@/app/(app)/admin/roles/role-form";
import { getCurrentUserAccess } from "@/lib/permissions";

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await getCurrentUserAccess();
  const { id } = await params;

  if (!access) {
    redirect(`/login?redirect=/admin/roles/${id}`);
  }

  if (!access.isAdmin) {
    redirect("/dashboard");
  }

  const role = await getRoleById(id);
  if (!role) {
    notFound();
  }

  return <RoleForm mode="edit" role={role} />;
}
