"use client";

import type { PipelineKpis } from "@sales-pipeline/shared";
import { HelpCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LeadsKpiRow({ kpis }: { kpis: PipelineKpis }) {
  const cards = [
    { title: "Total Leads", value: kpis.total.toString() },
    { title: "First Contact", value: kpis.firstContactPlus.toString() },
    { title: "Propunere prezentată", value: kpis.proposalPresentedPlus.toString() },
    { title: "Semnare contract", value: kpis.contractSigningPlus.toString() },
    {
      title: "Conversion Rate",
      value: `${kpis.conversionRate.toFixed(1).replace(".", ",")} %`,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title} className="shadow-none">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {card.title}
            </CardTitle>
            <HelpCircle className="text-muted-foreground size-4 shrink-0" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight">{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
