import { z } from "zod";

export const LeadStatusSchema = z.enum([
  "new_lead",
  "first_contact",
  "open_dialog",
  "proposal_prep",
  "proposal_presented",
  "negotiation",
  "contract_signing",
  "finalized",
  "lost",
]);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const LEAD_STATUSES: LeadStatus[] = [
  "new_lead",
  "first_contact",
  "open_dialog",
  "proposal_prep",
  "proposal_presented",
  "negotiation",
  "contract_signing",
  "finalized",
  "lost",
];

export type LeadPipelineStage = {
  status: LeadStatus;
  labelRo: string;
  labelEn: string;
  badgeClass: string;
};

export const LEAD_PIPELINE_STAGES: LeadPipelineStage[] = [
  {
    status: "new_lead",
    labelRo: "New lead",
    labelEn: "New lead",
    badgeClass: "bg-violet-100 text-violet-800",
  },
  {
    status: "first_contact",
    labelRo: "First contact",
    labelEn: "First contact",
    badgeClass: "bg-sky-100 text-sky-800",
  },
  {
    status: "open_dialog",
    labelRo: "Dialog deschis",
    labelEn: "Open dialog",
    badgeClass: "bg-teal-100 text-teal-800",
  },
  {
    status: "proposal_prep",
    labelRo: "Pregătire propunere",
    labelEn: "Proposal prep",
    badgeClass: "bg-indigo-100 text-indigo-800",
  },
  {
    status: "proposal_presented",
    labelRo: "Propunere prezentată",
    labelEn: "Proposal presented",
    badgeClass: "bg-blue-100 text-blue-800",
  },
  {
    status: "negotiation",
    labelRo: "Negociere",
    labelEn: "Negotiation",
    badgeClass: "bg-amber-100 text-amber-800",
  },
  {
    status: "contract_signing",
    labelRo: "Semnare contract",
    labelEn: "Contract signing",
    badgeClass: "bg-orange-100 text-orange-800",
  },
  {
    status: "finalized",
    labelRo: "Finalizate",
    labelEn: "Finalized",
    badgeClass: "bg-green-100 text-green-800",
  },
  {
    status: "lost",
    labelRo: "Lost",
    labelEn: "Lost",
    badgeClass: "bg-muted text-muted-foreground",
  },
];

export const DEFAULT_STAGE_TASKS: Record<LeadStatus, string[]> = {
  new_lead: [
    "Completează detaliile companiei",
    "Analiză site (nr pagini)",
    "Competitori",
    "Analiză proiect / cerințe",
  ],
  first_contact: ["Primul contact telefonic/email", "Confirmă interesul"],
  open_dialog: ["Identifică decidentul", "Notează obiecțiile"],
  proposal_prep: ["Pregătește oferta", "Estimează bugetul"],
  proposal_presented: ["Prezintă propunerea", "Follow-up după prezentare"],
  negotiation: ["Negociază termenii", "Actualizează bugetul"],
  contract_signing: ["Trimite contract", "Obține semnătura"],
  finalized: ["Handover către echipă", "Închide lead-ul"],
  lost: [],
};

export const LeadPrioritySchema = z.enum(["low", "medium", "high"]);
export type LeadPriority = z.infer<typeof LeadPrioritySchema>;

export const LeadSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  status: LeadStatusSchema,
  source: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  website_url: z.string().nullable(),
  cui: z.string().nullable(),
  turnover: z.number().nullable(),
  turnover_year: z.number().int().nullable(),
  termene_data: z.record(z.unknown()).nullable().optional(),
  termene_synced_at: z.string().nullable().optional(),
  message: z.string().nullable(),
  form_payload: z.record(z.unknown()),
  external_id: z.string().nullable(),
  assigned_to: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  priority: LeadPrioritySchema,
  deal_value: z.number().nullable(),
  deal_currency: z.string(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const LeadAssigneeSchema = z.object({
  full_name: z.string().nullable(),
  email: z.string().nullable(),
});
export type LeadAssignee = z.infer<typeof LeadAssigneeSchema>;

export const LeadServiceSchema = z.object({
  id: z.string().uuid(),
  lead_id: z.string().uuid(),
  service_name: z.string(),
  budget_amount: z.number().nullable(),
  currency: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type LeadService = z.infer<typeof LeadServiceSchema>;

export const LeadTaskSchema = z.object({
  id: z.string().uuid(),
  lead_id: z.string().uuid(),
  stage: LeadStatusSchema,
  title: z.string(),
  completed: z.boolean(),
  sort_order: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type LeadTask = z.infer<typeof LeadTaskSchema>;

export const LeadNoteAuthorSchema = z.object({
  full_name: z.string().nullable(),
  email: z.string().nullable(),
});

export const LeadNoteSchema = z.object({
  id: z.string().uuid(),
  lead_id: z.string().uuid(),
  author_id: z.string().uuid().nullable(),
  body: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
  deleted_by: z.string().uuid().nullable().optional(),
  author: LeadNoteAuthorSchema.nullable().optional(),
});
export type LeadNote = z.infer<typeof LeadNoteSchema>;
export type LeadNoteAuthor = z.infer<typeof LeadNoteAuthorSchema>;

export const AdminLeadNoteSchema = LeadNoteSchema.extend({
  lead: z
    .object({
      company: z.string().nullable(),
      name: z.string(),
    })
    .nullable()
    .optional(),
});
export type AdminLeadNote = z.infer<typeof AdminLeadNoteSchema>;

export const LeadMeetingSchema = z.object({
  id: z.string().uuid(),
  lead_id: z.string().uuid(),
  author_id: z.string().uuid().nullable(),
  title: z.string(),
  scheduled_at: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type LeadMeeting = z.infer<typeof LeadMeetingSchema>;

export const LeadOfferSchema = z.object({
  id: z.string().uuid(),
  lead_id: z.string().uuid(),
  author_id: z.string().uuid().nullable(),
  title: z.string(),
  amount: z.number().nullable(),
  currency: z.string(),
  status: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type LeadOffer = z.infer<typeof LeadOfferSchema>;

export const LeadLegalSchema = z.object({
  id: z.string().uuid(),
  lead_id: z.string().uuid(),
  author_id: z.string().uuid().nullable(),
  title: z.string(),
  status: z.string(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type LeadLegal = z.infer<typeof LeadLegalSchema>;

export const LeadWithAssigneeSchema = LeadSchema.extend({
  assignee: LeadAssigneeSchema.nullable().optional(),
  services_count: z.number().optional(),
});
export type LeadWithAssignee = z.infer<typeof LeadWithAssigneeSchema>;

export const LeadDetailSchema = LeadWithAssigneeSchema.extend({
  lead_services: z.array(LeadServiceSchema).optional(),
  lead_tasks: z.array(LeadTaskSchema).optional(),
  lead_notes: z.array(LeadNoteSchema).optional(),
  lead_meetings: z.array(LeadMeetingSchema).optional(),
  lead_offers: z.array(LeadOfferSchema).optional(),
  lead_legal: z.array(LeadLegalSchema).optional(),
});
export type LeadDetail = z.infer<typeof LeadDetailSchema>;

export const LeadWebhookPayloadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  website_url: z.string().max(500).optional(),
  message: z.string().max(5000).optional(),
  source: z.string().max(100).optional(),
  external_id: z.string().max(200).optional(),
  form_payload: z.record(z.unknown()).optional(),
});
export type LeadWebhookPayload = z.infer<typeof LeadWebhookPayloadSchema>;

export const CreateLeadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(50).nullable().optional(),
  company: z.string().max(200).nullable().optional(),
  website_url: z.string().max(500).nullable().optional(),
  message: z.string().max(5000).nullable().optional(),
  source: z.string().max(100).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
});
export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;

export const UpdateLeadSchema = z.object({
  status: LeadStatusSchema.optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  name: z.string().min(1).max(200).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(50).nullable().optional(),
  company: z.string().max(200).nullable().optional(),
  website_url: z.string().max(500).nullable().optional(),
  cui: z.string().max(50).nullable().optional(),
  turnover: z.number().nullable().optional(),
  turnover_year: z.number().int().min(1900).max(2100).nullable().optional(),
  message: z.string().max(5000).nullable().optional(),
  priority: LeadPrioritySchema.optional(),
  deal_value: z.number().nullable().optional(),
  deal_currency: z.string().max(10).optional(),
});
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;

export type LeadSummary = {
  new: number;
  inProgress: number;
  won: number;
};

export type PipelineKpis = {
  total: number;
  firstContactPlus: number;
  proposalPresentedPlus: number;
  contractSigningPlus: number;
  conversionRate: number;
};

export function getStageIndex(status: LeadStatus): number {
  return LEAD_PIPELINE_STAGES.findIndex((s) => s.status === status);
}

export function getStageLabel(status: LeadStatus, locale: "ro" | "en" = "ro"): string {
  const stage = LEAD_PIPELINE_STAGES.find((s) => s.status === status);
  if (!stage) return status;
  return locale === "en" ? stage.labelEn : stage.labelRo;
}

export function getStageBadgeClass(status: LeadStatus): string {
  return LEAD_PIPELINE_STAGES.find((s) => s.status === status)?.badgeClass ?? "bg-muted";
}

export function getNextStage(status: LeadStatus): LeadStatus | null {
  const idx = getStageIndex(status);
  if (idx < 0 || idx >= LEAD_PIPELINE_STAGES.length - 2) return null;
  const next = LEAD_PIPELINE_STAGES[idx + 1];
  return next?.status === "lost" ? null : (next?.status ?? null);
}

export type TimelineStepState = "completed" | "in_progress" | "pending";

export function getTimelineStepState(
  stepStatus: LeadStatus,
  currentStatus: LeadStatus,
): TimelineStepState {
  if (currentStatus === "lost") return "pending";
  const stepIdx = getStageIndex(stepStatus);
  const currentIdx = getStageIndex(currentStatus);
  if (stepIdx < currentIdx) return "completed";
  if (stepIdx === currentIdx) return "in_progress";
  return "pending";
}

export function summarizeLeads(leads: Pick<Lead, "status">[]): LeadSummary {
  return leads.reduce(
    (acc, lead) => {
      if (lead.status === "new_lead") acc.new += 1;
      if (
        lead.status !== "new_lead" &&
        lead.status !== "finalized" &&
        lead.status !== "lost"
      ) {
        acc.inProgress += 1;
      }
      if (lead.status === "finalized") acc.won += 1;
      return acc;
    },
    { new: 0, inProgress: 0, won: 0 },
  );
}

export function summarizePipeline(leads: Pick<Lead, "status">[]): PipelineKpis {
  const total = leads.length;
  const firstContactPlus = leads.filter(
    (l) => getStageIndex(l.status) >= getStageIndex("first_contact") && l.status !== "lost",
  ).length;
  const proposalPresentedPlus = leads.filter(
    (l) => getStageIndex(l.status) >= getStageIndex("proposal_presented") && l.status !== "lost",
  ).length;
  const contractSigningPlus = leads.filter(
    (l) => getStageIndex(l.status) >= getStageIndex("contract_signing") && l.status !== "lost",
  ).length;
  const finalized = leads.filter((l) => l.status === "finalized").length;
  const conversionRate = total > 0 ? (finalized / total) * 100 : 0;

  return {
    total,
    firstContactPlus,
    proposalPresentedPlus,
    contractSigningPlus,
    conversionRate,
  };
}

export function buildDefaultTasksForStage(stage: LeadStatus) {
  return DEFAULT_STAGE_TASKS[stage].map((title, index) => ({
    stage,
    title,
    completed: false,
    sort_order: index,
  }));
}

export const LeadCommunicationSchema = z.object({
  id: z.string(),
  subject: z.string(),
  from: z.string(),
  to: z.array(z.string()),
  date: z.string(),
  body: z.string(),
  snippet: z.string().optional(),
  mailboxEmail: z.string().email(),
});

export type LeadCommunication = z.infer<typeof LeadCommunicationSchema>;

export const GmailConnectionStatusSchema = z.object({
  connected: z.boolean(),
  googleEmail: z.string().email().nullable(),
  connectedAt: z.string().nullable(),
});

export type GmailConnectionStatus = z.infer<typeof GmailConnectionStatusSchema>;

export const TeamGmailMailboxSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().nullable(),
  googleEmail: z.string().email(),
  connectedAt: z.string(),
});

export type TeamGmailMailbox = z.infer<typeof TeamGmailMailboxSchema>;

export const TeamGmailPendingSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string().nullable(),
  email: z.string().email(),
});

export type TeamGmailPending = z.infer<typeof TeamGmailPendingSchema>;

export const TeamGmailSummarySchema = z.object({
  connected: z.array(TeamGmailMailboxSchema),
  pending: z.array(TeamGmailPendingSchema),
});

export type TeamGmailSummary = z.infer<typeof TeamGmailSummarySchema>;
