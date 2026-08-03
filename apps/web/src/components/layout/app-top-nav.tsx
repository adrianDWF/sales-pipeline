"use client";

import type { User } from "@supabase/supabase-js";
import { ChevronsUpDown, LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AppSearch } from "@/components/layout/app-search";
import { UserMenuPreferences } from "@/components/layout/user-menu-preferences";
import { useUserPreferences } from "@/components/user-preferences-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { getUserAvatar, getUserDisplayName, getUserInitials } from "@/lib/user";
import { cn } from "@/lib/utils";

type AppTopNavProps = {
  user: User | null;
  catalogSafeMode?: boolean;
};

export function AppTopNav({ user, catalogSafeMode = false }: AppTopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useUserPreferences();
  const displayName = user ? getUserDisplayName(user) : t("userMenu", "guest");
  const email = user?.email ?? "";
  const avatarUrl = user ? getUserAvatar(user) : undefined;

  async function handleSignOut() {
    if (catalogSafeMode) {
      return;
    }

    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <header className="bg-background z-10 flex h-14 shrink-0 items-center gap-3 border-b px-4 md:px-5">
      <AppSearch />

      <div className="relative ml-auto w-[min(calc(100vw-2rem),260px)] shrink-0">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className={cn(
            "hover:bg-muted/40 flex h-10 w-full items-center gap-2.5 rounded-xl border bg-background px-2.5 transition-colors",
            menuOpen && "border-primary ring-primary/20 ring-[3px]",
          )}
        >
          <Avatar className="size-7 shrink-0">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
            <AvatarFallback className="text-[10px]">
              {getUserInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 text-left leading-none">
            <p className="truncate text-sm font-semibold leading-tight">{displayName}</p>
            <p className="text-muted-foreground truncate text-[11px] leading-tight">{email}</p>
          </div>
          <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
        </button>

        {menuOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40"
              aria-label={t("userMenu", "closeMenu")}
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute top-full right-0 z-50 mt-2 w-full">
              <div className="space-y-1 rounded-xl border bg-background p-2 shadow-lg">
                <Button
                  className="h-9 w-full justify-start gap-2 rounded-lg bg-foreground text-background hover:bg-foreground/90"
                  size="sm"
                  asChild
                  onClick={() => setMenuOpen(false)}
                >
                  <Link href="/profile">
                    <UserIcon className="size-4" />
                    {t("userMenu", "myProfile")}
                  </Link>
                </Button>

                <UserMenuPreferences />

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={catalogSafeMode}
                  className="text-destructive hover:bg-destructive/10 flex h-9 w-full items-center justify-between rounded-lg px-3 text-sm font-medium transition-colors"
                >
                  <span>{t("userMenu", "logout")}</span>
                  <LogOut className="size-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
