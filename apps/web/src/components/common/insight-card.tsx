import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const severityStyles = {
  info: "border-l-muted-foreground",
  warning: "border-l-amber-500",
  critical: "border-l-red-500",
  success: "border-l-emerald-500",
} as const;

export function InsightCard({
  title,
  description,
  severity = "info",
  action,
  className,
}: {
  title: string;
  description: string;
  severity?: keyof typeof severityStyles;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-l-4 px-4 py-3",
        severityStyles[severity],
        className,
      )}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
        {description}
      </p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
