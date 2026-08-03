"use client";

import type { LeadDetail, LeadPriority, LeadStatus } from "@sales-pipeline/shared";
import { LEAD_STATUSES, getStageLabel } from "@sales-pipeline/shared";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  updateLeadAction,
  upsertLeadServicesAction,
} from "@/app/(app)/leads/actions";
import { LeadCuiField } from "@/components/leads/lead-cui-field";
import type { AssignableUser } from "@/lib/leads";
import type { TermeneCompanyLookup } from "@/lib/termene-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ServiceRow = {
  id?: string;
  service_name: string;
  budget_amount: string;
  currency: string;
};

export function LeadProfileForm({
  lead,
  assignableUsers,
  canManageAll,
}: {
  lead: LeadDetail;
  assignableUsers: AssignableUser[];
  canManageAll: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [company, setCompany] = useState(lead.company ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(lead.website_url ?? "");
  const [name, setName] = useState(lead.name);
  const [email, setEmail] = useState(lead.email);
  const [phone, setPhone] = useState(lead.phone ?? "");
  const [message, setMessage] = useState(lead.message ?? "");
  const [cui, setCui] = useState(lead.cui ?? "");
  const [priority, setPriority] = useState<LeadPriority>(lead.priority);
  const [status, setStatus] = useState<LeadStatus>(lead.status as LeadStatus);
  const [assignedTo, setAssignedTo] = useState(lead.assigned_to ?? "unassigned");
  const [dealValue, setDealValue] = useState(
    lead.deal_value != null ? String(lead.deal_value) : "",
  );
  const [dealCurrency, setDealCurrency] = useState(lead.deal_currency ?? "EUR");
  const [services, setServices] = useState<ServiceRow[]>(
    (lead.lead_services ?? []).map((s) => ({
      id: s.id,
      service_name: s.service_name,
      budget_amount: s.budget_amount != null ? String(s.budget_amount) : "",
      currency: s.currency,
    })),
  );

  function addServiceRow() {
    setServices((rows) => [...rows, { service_name: "", budget_amount: "", currency: "EUR" }]);
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const profileResult = await updateLeadAction(lead.id, {
        company: company || null,
        website_url: websiteUrl || null,
        name,
        email,
        phone: phone || null,
        message: message || null,
        cui: cui || null,
        priority,
        status,
        assigned_to: assignedTo === "unassigned" ? null : assignedTo,
        deal_value: dealValue ? Number(dealValue) : null,
        deal_currency: dealCurrency,
      });

      if ("error" in profileResult && profileResult.error) {
        setError(profileResult.error);
        return;
      }

      const servicesResult = await upsertLeadServicesAction(
        lead.id,
        services
          .filter((s) => s.service_name.trim())
          .map((s) => ({
            id: s.id,
            service_name: s.service_name.trim(),
            budget_amount: s.budget_amount ? Number(s.budget_amount) : null,
            currency: s.currency || "EUR",
          })),
      );

      if ("error" in servicesResult && servicesResult.error) {
        setError(servicesResult.error);
        return;
      }

      router.refresh();
    });
  }

  function applyTermeneData(data: TermeneCompanyLookup) {
    setCui(data.cui);
    if (data.name) setCompany(data.name);
    if (data.website) setWebsiteUrl(data.website);
    if (data.phone && !phone.trim()) setPhone(data.phone);
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Detalii brand</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nume brand">
            <Input value={company} onChange={(e) => setCompany(e.target.value)} />
          </Field>
          <Field label="URL website">
            <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
          </Field>
          <Field label="Nume contact">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Telefon">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Field>
          <div className="sm:col-span-2">
            <LeadCuiField cui={cui} onCuiChange={setCui} onApply={applyTermeneData} />
          </div>
        </div>
        <Field label="Mesaj / detalii">
          <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
        </Field>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h3 className="text-sm font-semibold">Detalii servicii</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {canManageAll ? (
            <Field label="Owner">
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Neasignat</SelectItem>
                  {assignableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.full_name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
          <Field label="Prioritate">
            <Select value={priority} onValueChange={(v) => setPriority(v as LeadPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {getStageLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Valoare deal">
            <div className="flex gap-2">
              <Input
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                type="number"
                min={0}
              />
              <Input
                value={dealCurrency}
                onChange={(e) => setDealCurrency(e.target.value)}
                className="w-20"
              />
            </div>
          </Field>
        </div>

        <div className="space-y-2">
          <Label>Servicii & buget</Label>
          {services.map((row, index) => (
            <div key={row.id ?? index} className="flex gap-2">
              <Input
                placeholder="Serviciu"
                value={row.service_name}
                onChange={(e) => {
                  const next = [...services];
                  next[index] = { ...row, service_name: e.target.value };
                  setServices(next);
                }}
              />
              <Input
                placeholder="Buget"
                type="number"
                value={row.budget_amount}
                onChange={(e) => {
                  const next = [...services];
                  next[index] = { ...row, budget_amount: e.target.value };
                  setServices(next);
                }}
                className="w-28"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setServices(services.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addServiceRow}>
            <Plus className="size-4" />
            Adaugă alt serviciu
          </Button>
        </div>
      </section>

      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      <div className="flex justify-end border-t pt-4">
        <Button type="button" disabled={isPending} onClick={save}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          Salvează
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
