import { z } from "zod";

export const LeadStatusSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
]);
export type LeadStatus = z.infer<typeof LeadStatusSchema>;

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "won",
  "lost",
];

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
  message: z.string().nullable(),
  form_payload: z.record(z.unknown()),
  external_id: z.string().nullable(),
  assigned_to: z.string().uuid().nullable(),
  notes: z.string().nullable(),
});
export type Lead = z.infer<typeof LeadSchema>;

export const LeadAssigneeSchema = z.object({
  full_name: z.string().nullable(),
  email: z.string().nullable(),
});
export type LeadAssignee = z.infer<typeof LeadAssigneeSchema>;

export const LeadWithAssigneeSchema = LeadSchema.extend({
  assignee: LeadAssigneeSchema.nullable().optional(),
});
export type LeadWithAssignee = z.infer<typeof LeadWithAssigneeSchema>;

export const LeadWebhookPayloadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  message: z.string().max(5000).optional(),
  source: z.string().max(100).optional(),
  external_id: z.string().max(200).optional(),
  form_payload: z.record(z.unknown()).optional(),
});
export type LeadWebhookPayload = z.infer<typeof LeadWebhookPayloadSchema>;

export const UpdateLeadSchema = z.object({
  status: LeadStatusSchema.optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
});
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;

export type LeadSummary = {
  new: number;
  inProgress: number;
  won: number;
};

export function summarizeLeads(
  leads: Pick<Lead, "status">[],
): LeadSummary {
  return leads.reduce(
    (acc, lead) => {
      if (lead.status === "new") acc.new += 1;
      if (lead.status === "contacted" || lead.status === "qualified") {
        acc.inProgress += 1;
      }
      if (lead.status === "won") acc.won += 1;
      return acc;
    },
    { new: 0, inProgress: 0, won: 0 },
  );
}
