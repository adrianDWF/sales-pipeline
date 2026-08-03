"use client";

import type { TermeneCompanyLookup } from "@/lib/termene-types";
import { BadgeCheck, Loader2, Search } from "lucide-react";
import { useState, useTransition } from "react";

import { lookupTermeneCompanyAction } from "@/app/(app)/leads/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function LeadCuiField({
  cui,
  onCuiChange,
  onApply,
}: {
  cui: string;
  onCuiChange: (value: string) => void;
  onApply: (data: TermeneCompanyLookup) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TermeneCompanyLookup | null>(null);

  function verify() {
    setError(null);
    startTransition(async () => {
      const response = await lookupTermeneCompanyAction(cui);
      if ("error" in response && response.error) {
        setError(response.error);
        setResult(null);
        return;
      }
      setResult(response.company ?? null);
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>CUI firmă</Label>
        <div className="flex gap-2">
          <Input
            value={cui}
            onChange={(e) => {
              onCuiChange(e.target.value);
              setResult(null);
              setError(null);
            }}
            placeholder="ex. 33034700"
            inputMode="numeric"
          />
          <Button type="button" variant="outline" disabled={isPending || !cui.trim()} onClick={verify}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Verifică
          </Button>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {result ? (
        <div className="bg-card space-y-3 rounded-xl border p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{result.name}</p>
              <p className="text-muted-foreground text-sm">CUI {result.cui}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.fiscalStatus ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full",
                    result.isActive
                      ? "border-green-200 bg-green-50 text-green-700"
                      : "border-red-200 bg-red-50 text-red-700",
                  )}
                >
                  {result.fiscalStatus}
                </Badge>
              ) : null}
              {result.termeneScore != null ? (
                <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700">
                  Scor Termene {result.termeneScore}
                </Badge>
              ) : null}
            </div>
          </div>

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {result.address ? (
              <div>
                <dt className="text-muted-foreground">Adresă</dt>
                <dd>{result.address}</dd>
              </div>
            ) : null}
            {result.caenLabel ? (
              <div>
                <dt className="text-muted-foreground">CAEN {result.caenCode ?? ""}</dt>
                <dd>{result.caenLabel}</dd>
              </div>
            ) : null}
            {result.vatStatus ? (
              <div>
                <dt className="text-muted-foreground">TVA</dt>
                <dd>{result.vatStatus}</dd>
              </div>
            ) : null}
            {result.companySize ? (
              <div>
                <dt className="text-muted-foreground">Mărime firmă</dt>
                <dd className="capitalize">{result.companySize}</dd>
              </div>
            ) : null}
            {result.registrationDate ? (
              <div>
                <dt className="text-muted-foreground">Înființată</dt>
                <dd>{result.registrationDate}</dd>
              </div>
            ) : null}
            {result.insolvencyRisk ? (
              <div>
                <dt className="text-muted-foreground">Risc insolvență</dt>
                <dd>{result.insolvencyRisk}</dd>
              </div>
            ) : null}
            {result.paymentCapacity != null ? (
              <div>
                <dt className="text-muted-foreground">Capacitate de plată</dt>
                <dd>
                  {new Intl.NumberFormat("ro-RO", {
                    style: "currency",
                    currency: "RON",
                    maximumFractionDigits: 0,
                  }).format(result.paymentCapacity)}
                </dd>
              </div>
            ) : null}
            {result.shareCapital != null ? (
              <div>
                <dt className="text-muted-foreground">Capital social</dt>
                <dd>
                  {new Intl.NumberFormat("ro-RO", {
                    style: "currency",
                    currency: "RON",
                    maximumFractionDigits: 0,
                  }).format(result.shareCapital)}
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="flex justify-end border-t pt-3">
            <Button type="button" size="sm" onClick={() => onApply(result)}>
              <BadgeCheck className="size-4" />
              Aplică datele
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
