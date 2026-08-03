import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingState({
  title,
  description,
  className,
  children,
}: {
  title?: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn("space-y-3 rounded-lg border bg-card p-6", className)}
      aria-busy="true"
      aria-live="polite"
    >
      {title ? <p className="text-sm font-medium">{title}</p> : null}
      {description ? (
        <p className="text-muted-foreground text-sm">{description}</p>
      ) : null}
      {children ?? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}
    </div>
  );
}

export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card px-4 py-3", className)}>
      <Skeleton className="h-3 w-20" />
      <Skeleton className="mt-3 h-8 w-24" />
    </div>
  );
}
