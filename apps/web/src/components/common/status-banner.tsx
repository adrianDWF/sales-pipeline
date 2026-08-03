import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type StatusBannerVariant = "success" | "warning" | "error" | "info";

const variantStyles: Record<
  StatusBannerVariant,
  { container: string; icon: typeof Info }
> = {
  success: {
    container:
      "border-green-200 bg-green-50 text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100",
    icon: CheckCircle2,
  },
  warning: {
    container:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
    icon: Info,
  },
  error: {
    container: "border-destructive/30 bg-destructive/10 text-destructive",
    icon: AlertCircle,
  },
  info: {
    container: "border-border bg-muted/50 text-foreground",
    icon: Info,
  },
};

export function StatusBanner({
  variant,
  children,
  className,
}: {
  variant: StatusBannerVariant;
  children: ReactNode;
  className?: string;
}) {
  const styles = variantStyles[variant];
  const Icon = styles.icon;

  return (
    <div
      role="status"
      className={cn(
        "flex gap-3 rounded-lg border px-4 py-3 text-sm leading-relaxed",
        styles.container,
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
