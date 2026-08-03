import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function DataTableToolbar({
  children,
  actions,
  className,
}: {
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between",
        className,
      )}
    >
      {children ? (
        <div className="grid flex-1 gap-2.5 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end">
          {children}
        </div>
      ) : null}
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
