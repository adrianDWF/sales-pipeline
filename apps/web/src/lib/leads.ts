import {
  LeadWithAssigneeSchema,
  summarizeLeads,
  type LeadSummary,
  type LeadWithAssignee,
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
  message,
  form_payload,
  external_id,
  assigned_to,
  notes,
  assignee:profiles!leads_assigned_to_fkey (
    full_name,
    email
  )
`;

export async function getLeadsForUser(
  _access: CurrentUserAccess,
): Promise<LeadWithAssignee[]> {
  void _access;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => LeadWithAssigneeSchema.parse(row));
}

export async function getLeadSummaryForUser(
  _access: CurrentUserAccess,
): Promise<LeadSummary> {
  const leads = await getLeadsForUser(_access);
  return summarizeLeads(leads);
}

export type AssignableUser = {
  id: string;
  full_name: string | null;
  email: string | null;
};

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

export async function getLeadById(id: string): Promise<LeadWithAssignee | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .select(LEAD_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? LeadWithAssigneeSchema.parse(data) : null;
}
