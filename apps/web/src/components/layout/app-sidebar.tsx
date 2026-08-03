"use client";

import type { PermissionKey } from "@sales-pipeline/shared";
import {
  ChevronDown,
  Headphones,
  LayoutDashboard,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  Users,
  UserCog,
  LayoutGrid,
  Inbox,
} from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useUserPreferences } from "@/components/user-preferences-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mainNav = [{ href: "/dashboard", key: "dashboard", icon: LayoutDashboard }];

const workspaceNav: {
  href: string;
  key: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: PermissionKey;
}[] = [
  { href: "/leads", key: "leads", icon: Inbox, permission: "portfolio" },
];

const adminNav = [
  { href: "/admin/overview", key: "adminOverview", icon: LayoutGrid, systemAdminOnly: true },
  { href: "/admin/users", key: "users", icon: Users },
  { href: "/admin/roles", key: "roleManagement", icon: UserCog },
];

function NavLinkIcon({
  icon: Icon,
}: {
  icon: React.ComponentType<{ className?: string }>;
}) {
  const { pending } = useLinkStatus();
  if (pending) {
    return <Loader2 className="size-[18px] shrink-0 animate-spin" aria-hidden />;
  }
  return <Icon className="size-[18px] shrink-0" />;
}

function NavSection({
  href,
  label,
  icon: Icon,
  isOpen,
  isSectionActive,
  children,
  onToggle,
  collapsed,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isOpen: boolean;
  isSectionActive: boolean;
  children: React.ReactNode;
  onToggle: () => void;
  collapsed: boolean;
}) {
  return (
    <div>
      {collapsed ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={label}
          aria-expanded={isOpen}
          aria-controls={`${href}-links`}
          title={label}
          className={cn(
            "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground flex h-9 w-full items-center justify-center rounded-lg p-2 transition-colors",
            isSectionActive && "bg-sidebar-accent text-sidebar-accent-foreground",
          )}
        >
          <Icon className="size-[18px]" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onToggle}
          aria-label={label}
          aria-expanded={isOpen}
          aria-controls={`${href}-links`}
          className={cn(
            "text-muted-foreground hover:text-foreground flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            isSectionActive && "bg-sidebar-accent text-sidebar-accent-foreground",
          )}
        >
          <span className="flex items-center gap-3">
            <Icon className="size-[18px]" />
            <span>{label}</span>
          </span>
          <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
        </button>
      )}

      {(collapsed || isOpen) && (
        <div id={`${href}-links`} className={cn("space-y-1", !collapsed && "relative pl-3")}>
          {children}
        </div>
      )}
    </div>
  );
}

export function AppSidebar({
  collapsed,
  onToggleCollapsed,
  isAdmin = false,
  isSystemAdmin = false,
  permissions = {
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
  },
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isAdmin?: boolean;
  isSystemAdmin?: boolean;
  permissions?: Record<PermissionKey, boolean>;
}) {
  const pathname = usePathname();
  const visibleWorkspaceNav = workspaceNav.filter(
    (item) => !item.permission || permissions[item.permission],
  );

  const isWorkspaceRouteActive = visibleWorkspaceNav.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  const isAdminRouteActive = pathname.startsWith("/admin");

  const [workspaceOpen, setWorkspaceOpen] = useState(isWorkspaceRouteActive);
  const [adminOpen, setAdminOpen] = useState(isAdminRouteActive);

  useEffect(() => {
    if (isWorkspaceRouteActive) setWorkspaceOpen(true);
  }, [isWorkspaceRouteActive]);

  useEffect(() => {
    if (isAdminRouteActive) setAdminOpen(true);
  }, [isAdminRouteActive]);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function NavLink({
    href,
    label,
    icon: Icon,
    nested = false,
  }: {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    nested?: boolean;
  }) {
    const active = isActive(href);
    return (
      <Link
        href={href}
        title={collapsed ? label : undefined}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
          nested && !collapsed && "ml-6",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
          collapsed && "justify-center px-2",
        )}
        aria-current={active ? "page" : undefined}
      >
        <NavLinkIcon icon={Icon} />
        {!collapsed && <span className="flex-1 truncate">{label}</span>}
      </Link>
    );
  }

  const { t } = useUserPreferences();

  return (
    <aside
      className={cn(
        "bg-background flex h-full shrink-0 flex-col overflow-hidden border-r transition-[width] duration-200",
        collapsed ? "w-[72px]" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b px-2.5",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5 px-1">
            <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg text-sm font-bold">
              SP
            </div>
            <span className="text-base font-semibold tracking-tight">Sales Pipeline</span>
          </Link>
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="text-muted-foreground hover:bg-sidebar-accent hover:text-foreground rounded-md p-2 transition-colors"
          aria-label={collapsed ? t("nav", "expandSidebar") : t("nav", "collapseSidebar")}
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden p-2.5">
        {mainNav.map((item) => (
          <NavLink key={item.href} href={item.href} label={t("nav", item.key)} icon={item.icon} />
        ))}

        {visibleWorkspaceNav.length > 0 ? (
          <div className="mt-1.5 space-y-0.5">
            <NavSection
              href="workspace"
              label={t("nav", "workspace")}
              icon={Inbox}
              isOpen={workspaceOpen}
              isSectionActive={isWorkspaceRouteActive}
              onToggle={() => setWorkspaceOpen((open) => !open)}
              collapsed={collapsed}
            >
              {visibleWorkspaceNav.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.key === "leads" ? "Leads" : t("nav", item.key)}
                  icon={item.icon}
                  nested={!collapsed}
                />
              ))}
            </NavSection>
          </div>
        ) : null}

        {isAdmin ? (
          <div className="mt-1.5">
            <NavSection
              href="admin"
              label={t("nav", "admin")}
              icon={Shield}
              isOpen={adminOpen}
              isSectionActive={isAdminRouteActive}
              onToggle={() => setAdminOpen((open) => !open)}
              collapsed={collapsed}
            >
              {adminNav
                .filter((item) => !item.systemAdminOnly || isSystemAdmin)
                .map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={t("nav", item.key)}
                    icon={item.icon}
                    nested={!collapsed}
                  />
                ))}
            </NavSection>
          </div>
        ) : null}
      </nav>

      <div className="shrink-0 p-2.5">
        <div
          className={cn(
            "bg-muted/60 rounded-xl border p-2.5",
            collapsed && "flex justify-center p-2",
          )}
        >
          {collapsed ? (
            <Headphones className="text-muted-foreground size-5" />
          ) : (
            <>
              <div className="mb-2.5 flex size-9 items-center justify-center rounded-lg border bg-background">
                <Headphones className="text-muted-foreground size-4" />
              </div>
              <p className="text-sm font-semibold">{t("nav", "needSupport")}</p>
              <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                {t("nav", "supportDescription")}
              </p>
              <Button variant="outline" size="sm" className="mt-2.5 w-full bg-background" asChild>
                <a href="mailto:support@example.com">{t("nav", "contactUs")}</a>
              </Button>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
