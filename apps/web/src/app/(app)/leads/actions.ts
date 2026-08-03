"use server";

import { revalidatePath } from "next/cache";

import {
  CreateLeadSchema,
  UpdateLeadSchema,
  buildDefaultTasksForStage,
  getNextStage,
  type LeadStatus,
} from "@sales-pipeline/shared";

import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";
import { fetchTermeneCompany, normalizeCuiInput } from "@/lib/termene";

async function canEditLead(
  supabase: Awaited<ReturnType<typeof createClient>>,
  leadId: string,
  userId: string,
  canManageAll: boolean,
) {
  if (canManageAll) return true;
  const { data: lead } = await supabase
    .from("leads")
    .select("assigned_to")
    .eq("id", leadId)
    .maybeSingle();
  return Boolean(lead && (lead.assigned_to === userId || lead.assigned_to === null));
}

function revalidateLeadPaths(leadId?: string) {
  revalidatePath("/leads");
  revalidatePath("/dashboard");
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

export async function createLeadAction(input: unknown) {
  await requirePermission("portfolio");
  const parsed = CreateLeadSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid lead data" };

  const supabase = await createClient();
  const payload = parsed.data;

  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone?.trim() || null,
      company: payload.company?.trim() || null,
      website_url: payload.website_url?.trim() || null,
      message: payload.message?.trim() || null,
      source: payload.source?.trim() || "manual",
      assigned_to: payload.assigned_to ?? null,
      status: "new_lead" as const,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  const defaultTasks = buildDefaultTasksForStage("new_lead").map((task) => ({
    ...task,
    lead_id: data.id,
  }));

  await supabase.from("lead_tasks").insert(defaultTasks);

  revalidateLeadPaths(data.id);
  return { ok: true, id: data.id };
}

export async function updateLeadAction(leadId: string, input: unknown) {
  const access = await requirePermission("portfolio");
  const parsed = UpdateLeadSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid lead update" };

  const canManageAll = access.permissions.clients_manage;
  const supabase = await createClient();

  if (!(await canEditLead(supabase, leadId, access.profile.id, canManageAll))) {
    return { error: "You cannot update this lead" };
  }

  if (
    !canManageAll &&
    parsed.data.assigned_to !== undefined &&
    parsed.data.assigned_to !== access.profile.id &&
    parsed.data.assigned_to !== null
  ) {
    return { error: "You cannot reassign this lead" };
  }

  const { error } = await supabase.from("leads").update(parsed.data).eq("id", leadId);
  if (error) return { error: error.message };

  revalidateLeadPaths(leadId);
  return { ok: true };
}

export async function advanceLeadStageAction(leadId: string) {
  const access = await requirePermission("portfolio");
  const supabase = await createClient();
  const canManageAll = access.permissions.clients_manage;

  if (!(await canEditLead(supabase, leadId, access.profile.id, canManageAll))) {
    return { error: "You cannot update this lead" };
  }

  const { data: lead } = await supabase
    .from("leads")
    .select("status")
    .eq("id", leadId)
    .single();

  if (!lead) return { error: "Lead not found" };

  const next = getNextStage(lead.status as LeadStatus);
  if (!next) return { error: "No next stage" };

  const { error } = await supabase.from("leads").update({ status: next }).eq("id", leadId);
  if (error) return { error: error.message };

  const defaultTasks = buildDefaultTasksForStage(next).map((task) => ({
    ...task,
    lead_id: leadId,
  }));
  if (defaultTasks.length > 0) {
    await supabase.from("lead_tasks").insert(defaultTasks);
  }

  revalidateLeadPaths(leadId);
  return { ok: true, status: next };
}

export async function archiveLeadAction(leadId: string) {
  return updateLeadAction(leadId, { status: "lost" });
}

export async function assignLeadToMeAction(leadId: string) {
  const access = await requirePermission("portfolio");
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("assigned_to, status")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) return { error: "Lead not found" };
  if (lead.assigned_to && lead.assigned_to !== access.profile.id) {
    return { error: "Lead is already assigned to someone else" };
  }

  const updates: { assigned_to: string; status?: LeadStatus } = {
    assigned_to: access.profile.id,
  };
  if (lead.status === "new_lead") {
    updates.status = "first_contact";
  }

  const { error } = await supabase.from("leads").update(updates).eq("id", leadId);
  if (error) return { error: error.message };

  revalidateLeadPaths(leadId);
  return { ok: true };
}

export async function upsertLeadServicesAction(
  leadId: string,
  services: { id?: string; service_name: string; budget_amount: number | null; currency: string }[],
) {
  const access = await requirePermission("portfolio");
  const supabase = await createClient();
  const canManageAll = access.permissions.clients_manage;

  if (!(await canEditLead(supabase, leadId, access.profile.id, canManageAll))) {
    return { error: "You cannot update this lead" };
  }

  await supabase.from("lead_services").delete().eq("lead_id", leadId);

  if (services.length > 0) {
    const { error } = await supabase.from("lead_services").insert(
      services.map((s) => ({
        lead_id: leadId,
        service_name: s.service_name,
        budget_amount: s.budget_amount,
        currency: s.currency || "EUR",
      })),
    );
    if (error) return { error: error.message };
  }

  revalidateLeadPaths(leadId);
  return { ok: true };
}

export async function toggleLeadTaskAction(taskId: string, completed: boolean) {
  const access = await requirePermission("portfolio");
  const supabase = await createClient();

  const { data: task } = await supabase
    .from("lead_tasks")
    .select("lead_id")
    .eq("id", taskId)
    .single();

  if (!task) return { error: "Task not found" };

  const canManageAll = access.permissions.clients_manage;
  if (!(await canEditLead(supabase, task.lead_id, access.profile.id, canManageAll))) {
    return { error: "You cannot update this task" };
  }

  const { error } = await supabase
    .from("lead_tasks")
    .update({ completed })
    .eq("id", taskId);

  if (error) return { error: error.message };
  revalidateLeadPaths(task.lead_id);
  return { ok: true };
}

export async function addLeadTaskAction(leadId: string, title: string, stage: LeadStatus) {
  const access = await requirePermission("portfolio");
  const supabase = await createClient();
  const canManageAll = access.permissions.clients_manage;

  if (!(await canEditLead(supabase, leadId, access.profile.id, canManageAll))) {
    return { error: "You cannot update this lead" };
  }

  const { error } = await supabase.from("lead_tasks").insert({
    lead_id: leadId,
    stage,
    title: title.trim(),
    completed: false,
    sort_order: 99,
  });

  if (error) return { error: error.message };
  revalidateLeadPaths(leadId);
  return { ok: true };
}

export async function addLeadNoteAction(leadId: string, body: string) {
  const access = await requirePermission("portfolio");
  const supabase = await createClient();
  const canManageAll = access.permissions.clients_manage;

  if (!(await canEditLead(supabase, leadId, access.profile.id, canManageAll))) {
    return { error: "You cannot update this lead" };
  }

  const { error } = await supabase.from("lead_notes").insert({
    lead_id: leadId,
    author_id: access.profile.id,
    body: body.trim(),
  });

  if (error) return { error: error.message };
  revalidateLeadPaths(leadId);
  return { ok: true };
}

export async function addLeadMeetingAction(
  leadId: string,
  input: { title: string; scheduled_at?: string | null; notes?: string | null },
) {
  const access = await requirePermission("portfolio");
  const supabase = await createClient();
  const canManageAll = access.permissions.clients_manage;

  if (!(await canEditLead(supabase, leadId, access.profile.id, canManageAll))) {
    return { error: "You cannot update this lead" };
  }

  const { error } = await supabase.from("lead_meetings").insert({
    lead_id: leadId,
    author_id: access.profile.id,
    title: input.title.trim(),
    scheduled_at: input.scheduled_at ?? null,
    notes: input.notes?.trim() || null,
  });

  if (error) return { error: error.message };
  revalidateLeadPaths(leadId);
  return { ok: true };
}

export async function deleteLeadMeetingAction(meetingId: string) {
  const access = await requirePermission("portfolio");
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("lead_meetings")
    .select("lead_id")
    .eq("id", meetingId)
    .single();

  if (!row) return { error: "Meeting not found" };

  const canManageAll = access.permissions.clients_manage;
  if (!(await canEditLead(supabase, row.lead_id, access.profile.id, canManageAll))) {
    return { error: "You cannot update this lead" };
  }

  const { error } = await supabase.from("lead_meetings").delete().eq("id", meetingId);
  if (error) return { error: error.message };
  revalidateLeadPaths(row.lead_id);
  return { ok: true };
}

export async function addLeadOfferAction(
  leadId: string,
  input: {
    title: string;
    amount?: number | null;
    currency?: string;
    status?: string;
    notes?: string | null;
  },
) {
  const access = await requirePermission("portfolio");
  const supabase = await createClient();
  const canManageAll = access.permissions.clients_manage;

  if (!(await canEditLead(supabase, leadId, access.profile.id, canManageAll))) {
    return { error: "You cannot update this lead" };
  }

  const { error } = await supabase.from("lead_offers").insert({
    lead_id: leadId,
    author_id: access.profile.id,
    title: input.title.trim(),
    amount: input.amount ?? null,
    currency: input.currency ?? "EUR",
    status: input.status ?? "draft",
    notes: input.notes?.trim() || null,
  });

  if (error) return { error: error.message };
  revalidateLeadPaths(leadId);
  return { ok: true };
}

export async function deleteLeadOfferAction(offerId: string) {
  const access = await requirePermission("portfolio");
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("lead_offers")
    .select("lead_id")
    .eq("id", offerId)
    .single();

  if (!row) return { error: "Offer not found" };

  const canManageAll = access.permissions.clients_manage;
  if (!(await canEditLead(supabase, row.lead_id, access.profile.id, canManageAll))) {
    return { error: "You cannot update this lead" };
  }

  const { error } = await supabase.from("lead_offers").delete().eq("id", offerId);
  if (error) return { error: error.message };
  revalidateLeadPaths(row.lead_id);
  return { ok: true };
}

export async function addLeadLegalAction(
  leadId: string,
  input: { title: string; status?: string; notes?: string | null },
) {
  const access = await requirePermission("portfolio");
  const supabase = await createClient();
  const canManageAll = access.permissions.clients_manage;

  if (!(await canEditLead(supabase, leadId, access.profile.id, canManageAll))) {
    return { error: "You cannot update this lead" };
  }

  const { error } = await supabase.from("lead_legal").insert({
    lead_id: leadId,
    author_id: access.profile.id,
    title: input.title.trim(),
    status: input.status ?? "pending",
    notes: input.notes?.trim() || null,
  });

  if (error) return { error: error.message };
  revalidateLeadPaths(leadId);
  return { ok: true };
}

export async function deleteLeadLegalAction(legalId: string) {
  const access = await requirePermission("portfolio");
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("lead_legal")
    .select("lead_id")
    .eq("id", legalId)
    .single();

  if (!row) return { error: "Legal record not found" };

  const canManageAll = access.permissions.clients_manage;
  if (!(await canEditLead(supabase, row.lead_id, access.profile.id, canManageAll))) {
    return { error: "You cannot update this lead" };
  }

  const { error } = await supabase.from("lead_legal").delete().eq("id", legalId);
  if (error) return { error: error.message };
  revalidateLeadPaths(row.lead_id);
  return { ok: true };
}

export async function lookupTermeneCompanyAction(cuiInput: string) {
  await requirePermission("portfolio");

  const cui = normalizeCuiInput(cuiInput);
  if (!cui) return { error: "Introdu un CUI valid" };

  try {
    const company = await fetchTermeneCompany(cui);
    return { ok: true, company };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Termene lookup failed";
    return { error: message };
  }
}
