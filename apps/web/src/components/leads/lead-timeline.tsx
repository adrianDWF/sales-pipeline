"use client";

import type { LeadStatus } from "@sales-pipeline/shared";
import {
  LEAD_PIPELINE_STAGES,
  getTimelineStepState,
} from "@sales-pipeline/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function LeadTimeline({
  currentStatus,
}: {
  currentStatus: LeadStatus;
}) {
  const steps = LEAD_PIPELINE_STAGES.filter((s) => s.status !== "lost");

  return (
    <div className="bg-card border-border rounded-xl border p-4">
      <h3 className="mb-4 text-sm font-semibold">Time line progress</h3>
      <ol className="space-y-4">
        {steps.map((step, index) => {
          const state = getTimelineStepState(step.status, currentStatus);
          return (
            <li key={step.status} className="flex gap-3">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  state === "completed" && "bg-green-100 text-green-800",
                  state === "in_progress" && "bg-amber-100 text-amber-800",
                  state === "pending" && "bg-muted text-muted-foreground",
                )}
              >
                {index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{step.labelRo}</p>
                <Badge
                  variant="secondary"
                  className={cn(
                    "mt-1 text-[10px]",
                    state === "in_progress" && "bg-amber-100 text-amber-800",
                    state === "pending" && "bg-muted text-muted-foreground",
                    state === "completed" && "bg-green-100 text-green-800",
                  )}
                >
                  {state === "in_progress"
                    ? "In progress"
                    : state === "completed"
                      ? "Done"
                      : "Neînceput"}
                </Badge>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
