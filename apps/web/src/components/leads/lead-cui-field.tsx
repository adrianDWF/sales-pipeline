"use client";

import type { TermeneCompanyLookup } from "@/lib/termene-types";
import { BadgeCheck, CheckCircle2, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { verifyAndSaveTermeneAction } from "@/app/(app)/leads/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function formatRon(value: number) {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    maximumFractionDigits: 0,
  }).format(value);
}

export function LeadCuiField({
  leadId,
  cui,
  turnover,
  turnoverYear,
  onCuiChange,
  onTurnoverChange,
  onApply,
  initialStoredData = null,
}: {
  leadId: string;
  cui: string;
  turnover: string;
  turnoverYear: string;
  onCuiChange: (value: string) => void;
  onTurnoverChange: (value: string, year: string) => void;
  onApply: (data: TermeneCompanyLookup) => void;
  initialStoredData?: TermeneCompanyLookup | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TermeneCompanyLookup | null>(initialStoredData);
  const [saved, setSaved] = useState(Boolean(initialStoredData));

  function verify() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const response = await verifyAndSaveTermeneAction(leadId, cui);
      if ("error" in response && response.error) {
        setError(response.error);
        setResult(null);
        return;
      }

      const company = response.company;
      if (!company) return;

      setResult(company);
      setSaved(true);
      onCuiChange(company.cui);
      onTurnoverChange(
        company.turnover != null ? String(company.turnover) : "",
        company.turnoverYear != null ? String(company.turnoverYear) : "",
      );
      onApply(company);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>CUI firmă</Label>
          <div className="flex gap-2">
            <Input
              value={cui}
              onChange={(e) => {
                onCuiChange(e.target.value);
                setResult(null);
                setSaved(false);
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

        <div className="space-y-2">
          <Label>Cifră de afaceri (RON)</Label>
          <div className="flex gap-2">
            <Input
              value={turnover}
              onChange={(e) => onTurnoverChange(e.target.value, turnoverYear)}
              placeholder="Din Termene după verificare"
              type="number"
              min={0}
            />
            <Input
              value={turnoverYear}
              onChange={(e) => onTurnoverChange(turnover, e.target.value)}
              placeholder="An"
              className="w-24"
              type="number"
              min={1900}
              max={2100}
            />
          </div>
        </div>
      </div>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {saved ? (
        <p className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="size-4" />
          Date Termene salvate în baza de date
          {initialStoredData && !isPending ? " (ultima sincronizare Termene)" : ""}.
        </p>
      ) : null}

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
            {result.turnover != null ? (
              <div>
                <dt className="text-muted-foreground">Cifră de afaceri netă</dt>
                <dd>
                  {formatRon(result.turnover)}
                  {result.turnoverYear ? ` (${result.turnoverYear})` : ""}
                </dd>
              </div>
            ) : null}
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
                <dd>{formatRon(result.paymentCapacity)}</dd>
              </div>
            ) : null}
            {result.shareCapital != null ? (
              <div>
                <dt className="text-muted-foreground">Capital social</dt>
                <dd>{formatRon(result.shareCapital)}</dd>
              </div>
            ) : null}
          </dl>

          <div className="flex justify-end border-t pt-3">
            <Button type="button" size="sm" variant="outline" onClick={() => onApply(result)}>
              <BadgeCheck className="size-4" />
              Aplică și alte câmpuri în formular
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
