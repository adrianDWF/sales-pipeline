import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { MuiProviders } from "@/components/common/mui-providers";
import { getCurrentUser, getCurrentUserAccess } from "@/lib/permissions";

// Rendered once for every authenticated route group. The sidebar, top nav,
// search, and preferences mount here and persist across navigations, so route
// changes only swap the page content rather than remounting the whole shell.
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [access, user] = await Promise.all([
    getCurrentUserAccess(),
    getCurrentUser(),
  ]);

  // Middleware already redirects unauthenticated requests with the correct
  // `redirect` target; this is the defensive fallback if the shell renders.
  if (!access || !user) {
    redirect("/login");
  }

  return (
    <MuiProviders>
      <AppShell access={access} initialUser={user}>
        {children}
      </AppShell>
    </MuiProviders>
  );
}
