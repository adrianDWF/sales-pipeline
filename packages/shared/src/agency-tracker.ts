import { z } from "zod";

export const TrackerCheckStatusSchema = z.enum([
  "ok",
  "warning",
  "error",
  "unknown",
]);
export type TrackerCheckStatus = z.infer<typeof TrackerCheckStatusSchema>;

export const TrackerIssueSeveritySchema = z.enum([
  "critical",
  "warning",
  "info",
]);
export type TrackerIssueSeverity = z.infer<typeof TrackerIssueSeveritySchema>;

export const TrackerBusinessModelSchema = z.enum([
  "ecommerce",
  "lead_gen",
  "hybrid",
  "unknown",
]);
export type TrackerBusinessModel = z.infer<typeof TrackerBusinessModelSchema>;

export const TrackerAnomalyReadinessSchema = z.enum([
  "ready",
  "building_history",
  "not_enough_history",
]);
export type TrackerAnomalyReadiness = z.infer<typeof TrackerAnomalyReadinessSchema>;

export type TrackerCheck = {
  id: string;
  label: string;
  status: TrackerCheckStatus;
  evidence: string;
  businessImpact: string;
  recommendedFix: string;
  owner: string;
  priority: TrackerIssueSeverity;
  category: "connection" | "collection" | "sync" | "attribution" | "anomaly";
};

export type TrackerSchemaItem = {
  id: string;
  label: string;
  group: "ecommerce_event" | "ecommerce_param" | "lead_gen";
  status: TrackerCheckStatus;
  evidence: string;
  businessImpact: string;
  recommendedFix: string;
};

export const TrackerIssueStatusSchema = z.enum([
  "open",
  "in_review",
  "resolved",
  "dismissed",
]);
export type TrackerIssueStatus = z.infer<typeof TrackerIssueStatusSchema>;

export type TrackerIssue = {
  id: string;
  severity: TrackerIssueSeverity;
  title: string;
  category: string;
  evidence: string;
  recommendedFix: string;
  owner: string;
  expectedImpact: string;
  confidence: number;
  checkId?: string;
  recurring?: boolean;
  status?: TrackerIssueStatus;
  ownerUserId?: string | null;
  dbId?: string;
};

export type TrackerBaselineDelta = {
  metricKey: string;
  current: number;
  baseline: number;
  deltaPct: number;
};

export type TrackerEvidenceItem = {
  id: string;
  type:
    | "ga4_event"
    | "gtm_container"
    | "sync_log"
    | "attribution_gap"
    | "schema_gap"
    | "permission";
  title: string;
  summary: string;
  payload: Record<string, string | number | boolean | null>;
};

export type TrackerOverview = {
  confidenceScore: number;
  confidenceLabel: "trusted" | "review" | "at_risk";
  ga4Status: TrackerCheckStatus;
  gtmStatus: TrackerCheckStatus;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  dataFreshnessAt: string | null;
  schemaCoveragePercent: number;
  criticalIssueCount: number;
  warningIssueCount: number;
  topFixes: string[];
  anomalyReadiness: TrackerAnomalyReadiness;
  anomalyReadinessMessage: string;
  businessModel: TrackerBusinessModel;
};

export type AgencyTrackerBundle = {
  overview: TrackerOverview;
  trackingChecks: TrackerCheck[];
  schemaItems: TrackerSchemaItem[];
  issues: TrackerIssue[];
  evidence: TrackerEvidenceItem[];
  baselineDeltas?: TrackerBaselineDelta[];
};

export const ECOMMERCE_FUNNEL_EVENTS = [
  { eventName: "view_item", label: "view_item" },
  { eventName: "add_to_cart", label: "add_to_cart" },
  { eventName: "view_cart", label: "view_cart" },
  { eventName: "begin_checkout", label: "begin_checkout" },
  { eventName: "add_shipping_info", label: "add_shipping_info" },
  { eventName: "add_payment_info", label: "add_payment_info" },
  { eventName: "purchase", label: "purchase" },
] as const;

export const LEAD_GEN_EVENTS = [
  { eventName: "form_start", label: "form_start" },
  { eventName: "generate_lead", label: "generate_lead / form_submit" },
  { eventName: "form_submit", label: "form_submit" },
] as const;
