"use server";

import { revalidatePath } from "next/cache";

import { UpdateLeadSchema, type LeadStatus } from "@sales-pipeline/shared";

import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export async function updateLeadAction(
  leadId: string,
  input: { status?: LeadStatus; assigned_to?: string | null; notes?: string | null },
) {
  const access = await requirePermission("portfolio");
  const parsed = UpdateLeadSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid lead update" };
  }

  const canManageAll = access.permissions.clients_manage;
  const supabase = await createClient();

  if (!canManageAll) {
    const { data: lead } = await supabase
      .from("leads")
      .select("assigned_to")
      .eq("id", leadId)
      .maybeSingle();

    if (!lead || lead.assigned_to !== access.profile.id) {
      return { error: "You can only update leads assigned to you" };
    }

    if (parsed.data.assigned_to !== undefined && parsed.data.assigned_to !== access.profile.id) {
      return { error: "You cannot reassign this lead" };
    }
  }

  const { error } = await supabase
    .from("leads")
    .update(parsed.data)
    .eq("id", leadId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function assignLeadToMeAction(leadId: string) {
  const access = await requirePermission("portfolio");
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("assigned_to")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) {
    return { error: "Lead not found" };
  }

  if (lead.assigned_to && lead.assigned_to !== access.profile.id) {
    return { error: "Lead is already assigned to someone else" };
  }

  const { error } = await supabase
    .from("leads")
    .update({ assigned_to: access.profile.id, status: "contacted" })
    .eq("id", leadId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { ok: true };
}
