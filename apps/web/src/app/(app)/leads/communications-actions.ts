"use server";

import {
  GmailConnectionStatusSchema,
  LeadCommunicationSchema,
  type GmailConnectionStatus,
  type LeadCommunication,
} from "@sales-pipeline/shared";

import { fetchLeadCommunications } from "@/lib/gmail/fetch-lead-communications";
import { getGmailConnectionForUser } from "@/lib/gmail/connections";
import { requirePermission } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

async function canViewLead(
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

export async function getGmailConnectionStatusAction(): Promise<
  GmailConnectionStatus | { error: string }
> {
  const access = await requirePermission("portfolio");
  const connection = await getGmailConnectionForUser(access.profile.id);

  return GmailConnectionStatusSchema.parse({
    connected: Boolean(connection),
    googleEmail: connection?.google_email ?? null,
    connectedAt: connection?.connected_at ?? null,
  });
}

export async function getLeadCommunicationsAction(leadId: string): Promise<
  | {
      ok: true;
      communications: LeadCommunication[];
      warning?: string;
      gmailStatus: GmailConnectionStatus;
    }
  | { error: string }
> {
  const access = await requirePermission("portfolio");
  const supabase = await createClient();
  const canManageAll = access.permissions.clients_manage;

  if (!(await canViewLead(supabase, leadId, access.profile.id, canManageAll))) {
    return { error: "Nu poți vedea comunicările acestui lead" };
  }

  const { data: lead, error } = await supabase
    .from("leads")
    .select("email, website_url")
    .eq("id", leadId)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!lead) return { error: "Lead negăsit" };

  const connection = await getGmailConnectionForUser(access.profile.id);
  const gmailStatus = GmailConnectionStatusSchema.parse({
    connected: Boolean(connection),
    googleEmail: connection?.google_email ?? null,
    connectedAt: connection?.connected_at ?? null,
  });

  try {
    const result = await fetchLeadCommunications({
      email: lead.email,
      websiteUrl: lead.website_url,
    });

    const communications = result.communications.map((item) =>
      LeadCommunicationSchema.parse(item),
    );

    return {
      ok: true,
      communications,
      warning: result.warning,
      gmailStatus,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Nu s-au putut încărca emailurile";
    return { error: message };
  }
}
