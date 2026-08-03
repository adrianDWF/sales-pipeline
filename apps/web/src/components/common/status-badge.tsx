import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusBadgeVariant =
  | "connected"
  | "partial"
  | "disconnected"
  | "syncing"
  | "error"
  | "unknown";

const variantMap: Record<
  StatusBadgeVariant,
  { label: string; className: string }
> = {
  connected: {
    label: "Connected",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  },
  partial: {
    label: "Partial",
    className: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  disconnected: {
    label: "Disconnected",
    className: "",
  },
  syncing: {
    label: "Syncing",
    className: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  },
  error: {
    label: "Error",
    className: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  },
  unknown: {
    label: "Unknown",
    className: "",
  },
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: StatusBadgeVariant;
  label?: string;
  className?: string;
}) {
  const config = variantMap[status];
  return (
    <Badge
      variant={status === "disconnected" || status === "unknown" ? "outline" : "secondary"}
      className={cn("text-[10px] font-medium", config.className, className)}
    >
      {label ?? config.label}
    </Badge>
  );
}
