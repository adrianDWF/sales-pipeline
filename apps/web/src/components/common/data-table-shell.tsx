import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DataTableShell({
  children,
  scrollHint = "Scroll horizontally for more columns",
  className,
  maxHeightClassName = "max-h-[calc(100vh-22rem)]",
}: {
  children: ReactNode;
  scrollHint?: string;
  className?: string;
  maxHeightClassName?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg border", className)}>
      <p className="text-muted-foreground border-b px-3 py-1.5 text-xs md:hidden">
        {scrollHint}
      </p>
      <div
        className={cn(
          "overflow-auto [scrollbar-gutter:stable]",
          maxHeightClassName,
        )}
      >
        {children}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card via-card/80 to-transparent"
      />
    </div>
  );
}

/** Opaque sticky cell classes for frozen first column + header layering */
export const dataTableSticky = {
  headerCell:
    "bg-muted text-muted-foreground sticky top-0 z-20 border-b px-3 py-2 text-xs font-medium uppercase tracking-wide",
  headerFirstCell:
    "bg-muted text-muted-foreground sticky left-0 top-0 z-30 border-b border-r px-4 py-2 text-left text-xs font-medium uppercase tracking-wide shadow-[4px_0_8px_-6px_rgba(0,0,0,0.15)]",
  bodyFirstCell:
    "bg-card sticky left-0 z-10 border-b border-r px-4 py-3 align-middle shadow-[4px_0_8px_-6px_rgba(0,0,0,0.12)]",
} as const;
