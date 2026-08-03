"use client";

import type { User } from "@supabase/supabase-js";
import type { AppLocale, PermissionKey } from "@sales-pipeline/shared";
import { useState } from "react";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopNav } from "@/components/layout/app-top-nav";
import { UserPreferencesProvider } from "@/components/user-preferences-provider";
import type { CurrentUserAccess } from "@/lib/permissions";

const DEFAULT_PERMISSIONS: Record<PermissionKey, boolean> = {
  dashboard: true,
  integrations: false,
  portfolio: true,
  admin: false,
  manual_sync: false,
  clients_view_all: false,
  clients_manage: false,
  seo_view: false,
  seo_manage: false,
  seo_manual_sync: false,
};

type AppShellProps = {
  children: React.ReactNode;
  access?: CurrentUserAccess | null;
  initialUser?: User | null;
};

// Presentational shell. Access and user are resolved once on the server by the
// authenticated layout and trusted here, so there is no duplicate client-side
// `auth.getUser()` or permission refetch during hydration.
export function AppShell({
  children,
  access,
  initialUser = null,
}: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const permissions = access?.permissions ?? DEFAULT_PERMISSIONS;
  const isAdmin = access?.isAdmin ?? false;
  const isSystemAdmin = Boolean(
    access?.profile.is_system_admin ||
      access?.assignedRoles.some((role) => role.slug === "super-admin"),
  );

  const initialLocale: AppLocale =
    access?.profile.preferred_locale === "en" ? "en" : "ro";
  const initialCurrency = access?.profile.preferred_currency ?? "RON";

  return (
    <UserPreferencesProvider
      initialLocale={initialLocale}
      initialCurrency={initialCurrency}
    >
      <div className="flex h-svh w-full overflow-hidden bg-background">
        <div className="hidden h-svh shrink-0 md:flex">
          <AppSidebar
            collapsed={sidebarCollapsed}
            onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
            isAdmin={isAdmin}
            isSystemAdmin={isSystemAdmin}
            permissions={permissions}
          />
        </div>

        <div className="flex h-svh min-w-0 flex-1 flex-col overflow-hidden">
          <AppTopNav user={initialUser} />
          <main className="bg-sidebar min-h-0 flex-1 overflow-y-auto p-4 md:p-5">{children}</main>
        </div>
      </div>
    </UserPreferencesProvider>
  );
}
