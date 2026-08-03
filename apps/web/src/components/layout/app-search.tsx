"use client";

import { LayoutDashboard, Inbox, Users, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
};

const STATIC_ITEMS: SearchItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="size-4" /> },
  { id: "leads", label: "Leads", href: "/leads", icon: <Inbox className="size-4" /> },
  { id: "admin-users", label: "Users", href: "/admin/users", icon: <Users className="size-4" /> },
  { id: "admin-roles", label: "Roles", href: "/admin/roles", icon: <UserCog className="size-4" /> },
];

export function AppSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STATIC_ITEMS;
    return STATIC_ITEMS.filter((item) => item.label.toLowerCase().includes(q));
  }, [query]);

  const onSelect = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        inputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="relative w-full max-w-md">
      <Input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search pages…"
        className="h-10"
        aria-expanded={open}
        aria-controls="app-search-results"
      />

      {open && results.length > 0 ? (
        <div
          id="app-search-results"
          className="bg-popover absolute top-full z-50 mt-2 w-full overflow-hidden rounded-lg border shadow-md"
        >
          <ul className="max-h-72 overflow-y-auto p-1">
            {results.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={cn(
                    "hover:bg-accent flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm",
                  )}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onSelect(item.href);
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
