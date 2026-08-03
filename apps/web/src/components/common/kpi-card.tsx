import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EMPTY_DISPLAY } from "@/lib/format-display";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  hint,
  trend,
  footer,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  const displayValue =
    value == null || value === "" ? EMPTY_DISPLAY : value;

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {displayValue}
          </p>
          {trend}
        </div>
        {hint ? (
          <p className="text-muted-foreground text-xs leading-relaxed">{hint}</p>
        ) : null}
        {footer}
      </CardContent>
    </Card>
  );
}
