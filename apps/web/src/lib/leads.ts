import {
  LeadDetailSchema,
  LeadWithAssigneeSchema,
  summarizePipeline,
  type LeadDetail,
  type LeadStatus,
  type LeadWithAssignee,
  type PipelineKpis,
} from "@sales-pipeline/shared";

import type { CurrentUserAccess } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

const LEAD_SELECT = `
  id,
  created_at,
  updated_at,
  status,
  source,
  name,
  email,
  phone,
  company,
  website_url,
  cui,
  message,
  form_payload,
  external_id,
  assigned_to,
  notes,
  priority,
  deal_value,
  deal_currency,
  assignee:profiles!leads_assigned_to_fkey (
    full_name,
    email
  )
`;

const LEAD_DETAIL_SELECT = `
  ${LEAD_SELECT},
  lead_services ( id, lead_id, service_name, budget_amount, currency, created_at, updated_at ),
  lead_tasks ( id, lead_id, stage, title, completed, sort_order, created_at, updated_at ),
  lead_notes ( id, lead_id, author_id, body, created_at, updated_at ),
  lead_meetings ( id, lead_id, author_id, title, scheduled_at, notes, created_at, updated_at ),
  lead_offers ( id, lead_id, author_id, title, amount, currency, status, notes, created_at, updated_at ),
  lead_legal ( id, lead_id, author_id, title, status, notes, created_at, updated_at )
`;

export type AssignableUser = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export type LeadFilters = {
  ownerId?: string | "unassigned" | "all";
  status?: LeadStatus | "all";
};

export type LeadFacets = {
  byOwner: Record<string, number>;
  byStatus: Record<string, number>;
  unassigned: number;
  newLeadUnassigned: number;
};

function parseLeadRow(row: Record<string, unknown>): LeadWithAssignee {
  const services = row.lead_services as unknown[] | undefined;
  const parsed = LeadWithAssigneeSchema.parse({
    ...row,
    deal_value: row.deal_value != null ? Number(row.deal_value) : null,
    services_count: Array.isArray(services) ? services.length : undefined,
  });
  return parsed;
}

export async function getLeadsForUser(
  _access: CurrentUserAccess,
  filters: LeadFilters = {},
): Promise<LeadWithAssignee[]> {
  void _access;
  const supabase = await createClient();
  let query = supabase
    .from("leads")
    .select(`${LEAD_SELECT}, lead_services(count)`)
    .order("created_at", { ascending: false });

  if (filters.ownerId && filters.ownerId !== "all") {
    if (filters.ownerId === "unassigned") {
      query = query.is("assigned_to", null);
    } else {
      query = query.eq("assigned_to", filters.ownerId);
    }
  }

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const countRow = row as Record<string, unknown> & {
      lead_services?: { count: number }[];
    };
    const servicesCount = countRow.lead_services?.[0]?.count ?? 0;
    return parseLeadRow({ ...row, services_count: servicesCount });
  });
}

export async function getLeadFacets(_access: CurrentUserAccess): Promise<LeadFacets> {
  void _access;
  const leads = await getLeadsForUser(_access);
  const byOwner: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let unassigned = 0;
  let newLeadUnassigned = 0;

  for (const lead of leads) {
    byStatus[lead.status] = (byStatus[lead.status] ?? 0) + 1;
    if (!lead.assigned_to) {
      unassigned += 1;
      if (lead.status === "new_lead") {
        newLeadUnassigned += 1;
      }
    } else {
      byOwner[lead.assigned_to] = (byOwner[lead.assigned_to] ?? 0) + 1;
    }
  }

  return { byOwner, byStatus, unassigned, newLeadUnassigned };
}

export async function getPipelineKpis(_access: CurrentUserAccess): Promise<PipelineKpis> {
  const leads = await getLeadsForUser(_access);
  return summarizePipeline(leads);
}

export async function getLeadSummaryForUser(_access: CurrentUserAccess) {
  const { summarizeLeads } = await import("@sales-pipeline/shared");
  const leads = await getLeadsForUser(_access);
  return summarizeLeads(leads);
}

export async function getAssignableUsers(): Promise<AssignableUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("approval_status", "approved")
    .order("full_name");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getLeadById(id: string): Promise<LeadDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  const row = data as Record<string, unknown>;
  return LeadDetailSchema.parse({
    ...row,
    deal_value: row.deal_value != null ? Number(row.deal_value) : null,
    lead_services: (row.lead_services as Record<string, unknown>[] | null)?.map((s) => ({
      ...s,
      budget_amount: s.budget_amount != null ? Number(s.budget_amount) : null,
    })),
    lead_offers: (row.lead_offers as Record<string, unknown>[] | null)?.map((o) => ({
      ...o,
      amount: o.amount != null ? Number(o.amount) : null,
    })),
  });
}
