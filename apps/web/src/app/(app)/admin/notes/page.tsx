import Link from "next/link";
import { redirect } from "next/navigation";

import { LeadNotesAdminTable } from "@/components/admin/lead-notes-admin-table";
import { PageHeader } from "@/components/common/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getLeadNotesForAdmin, type LeadNotesAdminFilter } from "@/lib/lead-notes-admin";
import { isSuperUser, requirePermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const filters: { value: LeadNotesAdminFilter; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "deleted", label: "Șterse" },
  { value: "all", label: "Toate" },
];

export default async function AdminLeadNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const access = await requirePermission("portfolio");
  if (!isSuperUser(access)) redirect("/dashboard");

  const params = await searchParams;
  const filter =
    params.filter === "active" || params.filter === "deleted" || params.filter === "all"
      ? params.filter
      : "all";

  const notes = await getLeadNotesForAdmin(filter);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Admin"
        title="Lead notes"
        description="Vizualizează notițele șterse, restaurează greșeli sau șterge definitiv."
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <Link
            key={item.value}
            href={`/admin/notes?filter=${item.value}`}
            className={cn(
              buttonVariants({
                variant: filter === item.value ? "default" : "outline",
                size: "sm",
              }),
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      <LeadNotesAdminTable notes={notes} />
    </div>
  );
}
