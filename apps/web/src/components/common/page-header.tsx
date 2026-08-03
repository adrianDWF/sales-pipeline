import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  descriptionHydrationWarning = false,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  descriptionHydrationWarning?: boolean;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-0.5">
        {eyebrow ? (
          <p className="text-muted-foreground text-sm font-medium">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? (
          <p
            className="text-muted-foreground max-w-3xl text-sm leading-relaxed"
            suppressHydrationWarning={descriptionHydrationWarning}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
