import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function RecommendationCard({
  title,
  reason,
  impact,
  confidence,
  suggestedAction,
  actions,
  className,
}: {
  title: string;
  reason: string;
  impact?: "low" | "medium" | "high";
  confidence?: "low" | "medium" | "high";
  suggestedAction?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {impact ? (
              <Badge variant="outline" className="text-[10px] uppercase">
                Impact: {impact}
              </Badge>
            ) : null}
            {confidence ? (
              <Badge variant="secondary" className="text-[10px] uppercase">
                Confidence: {confidence}
              </Badge>
            ) : null}
          </div>
        </div>
        <CardDescription className="leading-relaxed">{reason}</CardDescription>
      </CardHeader>
      {suggestedAction ? (
        <CardContent className="pt-0">
          <p className="text-sm">
            <span className="font-medium">Suggested action: </span>
            {suggestedAction}
          </p>
        </CardContent>
      ) : null}
      {actions ? <CardFooter className="gap-2">{actions}</CardFooter> : null}
    </Card>
  );
}
