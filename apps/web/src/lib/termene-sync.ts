import type { TermeneCompanyLookup } from "@/lib/termene-types";
import { parseStoredTermeneData } from "@/lib/termene-types";
import { fetchTermeneCompany, normalizeCuiInput } from "@/lib/termene";
import { createAdminClient } from "@/lib/supabase/admin";

export type TermeneFieldChange = {
  field: string;
  label: string;
  previous: string | number | boolean | null;
  current: string | number | boolean | null;
};

const TRACKED_TERMENE_FIELDS: Array<{
  key: keyof TermeneCompanyLookup;
  label: string;
}> = [
  { key: "turnover", label: "Cifră de afaceri" },
  { key: "turnoverYear", label: "An cifră de afaceri" },
  { key: "termeneScore", label: "Scor Termene" },
  { key: "paymentCapacity", label: "Capacitate de plată" },
  { key: "hasAnafDebts", label: "Datorii ANAF" },
  { key: "insolvencyRisk", label: "Risc insolvență" },
  { key: "fiscalStatus", label: "Statut fiscal" },
  { key: "isActive", label: "Firmă activă" },
  { key: "vatStatus", label: "TVA" },
  { key: "companySize", label: "Mărime firmă" },
  { key: "shareCapital", label: "Capital social" },
];

export function computeTermeneChanges(
  previous: TermeneCompanyLookup | null,
  current: TermeneCompanyLookup,
): TermeneFieldChange[] {
  if (!previous) return [];

  return TRACKED_TERMENE_FIELDS.flatMap(({ key, label }) => {
    const prevValue = previous[key] ?? null;
    const nextValue = current[key] ?? null;
    if (Object.is(prevValue, nextValue)) return [];
    return [{ field: key, label, previous: prevValue, current: nextValue }];
  });
}

type LeadTermeneRow = {
  id: string;
  cui: string | null;
  phone: string | null;
  company: string | null;
  website_url: string | null;
  termene_data: unknown;
};

export async function saveTermeneSnapshotForLead(input: {
  leadId: string;
  company: TermeneCompanyLookup;
  source: "manual" | "cron";
  previousData?: TermeneCompanyLookup | null;
  existingLead?: Pick<LeadTermeneRow, "phone" | "company" | "website_url"> | null;
}) {
  const admin = createAdminClient();
  const changes = computeTermeneChanges(input.previousData ?? null, input.company);
  const existing = input.existingLead;

  const { error: updateError } = await admin
    .from("leads")
    .update({
      cui: input.company.cui,
      turnover: input.company.turnover,
      turnover_year: input.company.turnoverYear,
      termene_data: input.company,
      termene_synced_at: new Date().toISOString(),
      company: input.company.name || existing?.company || null,
      website_url: input.company.website ?? existing?.website_url ?? null,
      phone: existing?.phone?.trim() ? existing.phone : input.company.phone,
    })
    .eq("id", input.leadId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const { error: snapshotError } = await admin.from("lead_termene_snapshots").insert({
    lead_id: input.leadId,
    data: input.company,
    changes,
    source: input.source,
  });

  if (snapshotError) {
    throw new Error(snapshotError.message);
  }

  return { changes };
}

export async function syncAllLeadTermeneProfiles(): Promise<{
  processed: number;
  updated: number;
  failed: number;
  changed: number;
  errors: Array<{ leadId: string; cui: string; error: string }>;
}> {
  const admin = createAdminClient();
  const { data: leads, error } = await admin
    .from("leads")
    .select("id, cui, phone, company, website_url, termene_data")
    .not("cui", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (leads ?? []) as LeadTermeneRow[];
  let updated = 0;
  let failed = 0;
  let changed = 0;
  const errors: Array<{ leadId: string; cui: string; error: string }> = [];

  for (const lead of rows) {
    const cui = normalizeCuiInput(lead.cui ?? "");
    if (!cui) continue;

    try {
      const company = await fetchTermeneCompany(cui);
      const previousData = parseStoredTermeneData(lead.termene_data);
      const { changes } = await saveTermeneSnapshotForLead({
        leadId: lead.id,
        company,
        source: "cron",
        previousData,
        existingLead: lead,
      });
      updated += 1;
      if (changes.length > 0) changed += 1;
    } catch (err) {
      failed += 1;
      errors.push({
        leadId: lead.id,
        cui: lead.cui ?? "",
        error: err instanceof Error ? err.message : "Sync failed",
      });
    }
  }

  return {
    processed: rows.length,
    updated,
    failed,
    changed,
    errors,
  };
}
