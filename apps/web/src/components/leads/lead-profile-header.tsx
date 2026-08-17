"use client";

import type { LeadDetail, LeadStatus } from "@sales-pipeline/shared";
import {
  getNextStage,
  getStageBadgeClass,
  getStageLabel,
} from "@sales-pipeline/shared";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  advanceLeadStageAction,
  archiveLeadAction,
} from "@/app/(app)/leads/actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { companyFaviconUrl, companyInitials } from "@/lib/company-brand";

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LeadProfileHeader({ lead }: { lead: LeadDetail }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const nextStage = getNextStage(lead.status as LeadStatus);
  const label = lead.company?.trim() || lead.name;
  const favicon = companyFaviconUrl(lead.website_url);

  function advance() {
    startTransition(async () => {
      await advanceLeadStageAction(lead.id);
      router.refresh();
    });
  }

  function archive() {
    startTransition(async () => {
      await archiveLeadAction(lead.id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <Avatar className="size-12 rounded-xl">
            {favicon ? <AvatarImage src={favicon} alt={label} className="rounded-xl" /> : null}
            <AvatarFallback className="rounded-xl text-sm font-semibold">
              {companyInitials(lead.company, lead.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold">{lead.company || lead.name}</h1>
              <Badge className={getStageBadgeClass(lead.status as LeadStatus)}>
                {getStageLabel(lead.status as LeadStatus)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{lead.website_url || "—"}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              #{lead.id.slice(0, 8).toUpperCase()} · {lead.source} ·{" "}
              {formatDateTime(lead.created_at)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {nextStage ? (
            <Button type="button" disabled={isPending} onClick={advance}>
              Următorul pas
              <ArrowRight className="size-4" />
            </Button>
          ) : null}
          <Button type="button" variant="outline" disabled={isPending} onClick={archive}>
            Arhivează
          </Button>
        </div>
      </div>
    </div>
  );
}
