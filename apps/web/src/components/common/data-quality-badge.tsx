import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type DataQualityLevel = "fresh" | "stale" | "missing" | "error";

const levelConfig: Record<
  DataQualityLevel,
  { label: string; className: string }
> = {
  fresh: {
    label: "Fresh",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  },
  stale: {
    label: "Stale",
    className: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  missing: {
    label: "No data",
    className: "",
  },
  error: {
    label: "Sync error",
    className: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  },
};

export function DataQualityBadge({
  level,
  detail,
  className,
}: {
  level: DataQualityLevel;
  detail?: string;
  className?: string;
}) {
  const config = levelConfig[level];
  return (
    <Badge
      variant={level === "missing" ? "outline" : "secondary"}
      title={detail}
      className={cn("text-[10px] font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
