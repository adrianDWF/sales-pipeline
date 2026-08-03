import type {
  AgencyTrackerBundle,
  TrackerAnomalyReadiness,
  TrackerBusinessModel,
  TrackerCheck,
  TrackerCheckStatus,
  TrackerEvidenceItem,
  TrackerIssue,
  TrackerIssueSeverity,
  TrackerOverview,
  TrackerSchemaItem,
} from "./agency-tracker.js";
import {
  ECOMMERCE_FUNNEL_EVENTS,
  LEAD_GEN_EVENTS,
} from "./agency-tracker.js";

export type AgencyTrackerFunnelStep = {
  eventName: string;
  activeUsers: number;
  eventCount: number;
};

export type AgencyTrackerCustomEvent = {
  eventName: string;
  eventCount: number;
};

export type AgencyTrackerSyncLog = {
  finishedAt: string | null;
  status: string;
  message: string | null;
  startedAt: string;
};

export type AgencyTrackerInput = {
  hasAnalytics: boolean;
  hasGtm: boolean;
  analytics: {
    sessions: number;
    transactions: number;
    sessionsNotSet: number;
    transactionsNotSet: number;
    revenue: number;
    addToCarts: number;
    itemViews: number;
  };
  tagManager: {
    tagsCount: number;
    triggersCount: number;
    variablesCount: number;
    publishedVersionId: number;
    containers: Array<{
      label: string;
      tagsCount: number;
      triggersCount: number;
      variablesCount: number;
      publishedVersionId: number;
    }>;
  };
  funnel: AgencyTrackerFunnelStep[];
  customEvents: AgencyTrackerCustomEvent[];
  lastSync: AgencyTrackerSyncLog | null;
  uxRecordedAt: string | null;
  syncHistoryCount: number;
  dataSources: Array<{
    service: string;
    sync_enabled: boolean;
    label: string | null;
  }>;
  baselineDeltas?: Array<{
    metricKey: string;
    current: number;
    baseline: number;
    deltaPct: number;
  }>;
};

const ANOMALY_MIN_SYNCS = 7;

function statusFromFlags(ok: boolean, warn: boolean): TrackerCheckStatus {
  if (ok) return "ok";
  if (warn) return "warning";
  return "error";
}

export function inferBusinessModel(input: AgencyTrackerInput): TrackerBusinessModel {
  const hasEcommerceSignals =
    input.analytics.transactions > 0 ||
    input.analytics.addToCarts > 0 ||
    input.funnel.some((row) =>
      ["view_item", "add_to_cart", "purchase"].includes(row.eventName),
    );
  const hasLeadSignals = input.customEvents.some((row) =>
    ["generate_lead", "form_submit", "form_start"].includes(row.eventName),
  );
  if (hasEcommerceSignals && hasLeadSignals) return "hybrid";
  if (hasEcommerceSignals) return "ecommerce";
  if (hasLeadSignals) return "lead_gen";
  return "unknown";
}

export function computeAnomalyReadiness(syncHistoryCount: number): {
  readiness: TrackerAnomalyReadiness;
  message: string;
} {
  if (syncHistoryCount >= ANOMALY_MIN_SYNCS) {
    return {
      readiness: "ready",
      message: "Enough sync history is available for 7v7 anomaly checks.",
    };
  }
  if (syncHistoryCount >= 2) {
    return {
      readiness: "building_history",
      message: `Building history (${syncHistoryCount}/${ANOMALY_MIN_SYNCS} syncs). 7v7 anomaly detection is not active yet.`,
    };
  }
  return {
    readiness: "not_enough_history",
    message:
      "Not enough history for anomaly detection yet. Run regular syncs over at least one week.",
  };
}

export function buildTrackingChecks(input: AgencyTrackerInput): TrackerCheck[] {
  const funnelByEvent = new Map(input.funnel.map((row) => [row.eventName, row]));
  const hasPurchase =
    (funnelByEvent.get("purchase")?.activeUsers ?? 0) > 0 ||
    input.analytics.transactions > 0;
  const hasViewItem = (funnelByEvent.get("view_item")?.activeUsers ?? 0) > 0;
  const sessionNotSetRate =
    input.analytics.sessions > 0
      ? (input.analytics.sessionsNotSet / input.analytics.sessions) * 100
      : 0;
  const syncOk = input.lastSync?.status === "success";
  const syncStale =
    !input.lastSync?.finishedAt ||
    Date.now() - new Date(input.lastSync.finishedAt).getTime() > 48 * 60 * 60 * 1000;
  const analyticsSyncOn = input.dataSources.some(
    (ds) => ds.service === "analytics" && ds.sync_enabled,
  );

  const checks: TrackerCheck[] = [
    {
      id: "ga4_connected",
      label: "GA4 connected",
      status: input.hasAnalytics ? "ok" : "error",
      evidence: input.hasAnalytics
        ? "Analytics data source is linked to this client."
        : "No Google Analytics data source assigned.",
      businessImpact: input.hasAnalytics
        ? "Core ecommerce and funnel monitoring is possible."
        : "Cannot validate collection, schema, or revenue trust.",
      recommendedFix: "Connect GA4 in Integrations and assign the property to this client.",
      owner: "Data lead",
      priority: input.hasAnalytics ? "info" : "critical",
      category: "connection",
    },
    {
      id: "gtm_connected",
      label: "GTM connected",
      status: input.hasGtm ? "ok" : "warning",
      evidence: input.hasGtm
        ? "Tag Manager data source is linked."
        : "No GTM container linked to this client.",
      businessImpact: input.hasGtm
        ? "Container inventory and tag health can be monitored."
        : "Harder to diagnose tag-level tracking issues.",
      recommendedFix: "Connect GTM and assign the live container for this client.",
      owner: "Technical lead",
      priority: input.hasGtm ? "info" : "warning",
      category: "connection",
    },
    {
      id: "ga4_collecting",
      label: "GA4 collecting data",
      status: statusFromFlags(
        input.analytics.sessions > 0 || input.funnel.length > 0,
        false,
      ),
      evidence:
        input.analytics.sessions > 0
          ? `${input.analytics.sessions} sessions in the current period.`
          : input.funnel.length > 0
            ? "Funnel events synced but session volume is zero."
            : "No sessions or funnel events in the synced period.",
      businessImpact: "Without live collection, monitoring and alerts are unreliable.",
      recommendedFix: "Verify the GA4 tag fires on the site and rerun Sync now.",
      owner: "Data lead",
      priority: input.analytics.sessions > 0 ? "info" : "critical",
      category: "collection",
    },
    {
      id: "important_events",
      label: "Important events active",
      status: statusFromFlags(hasViewItem || input.analytics.itemViews > 0, false),
      evidence: hasViewItem
        ? "view_item is present in synced funnel data."
        : input.analytics.itemViews > 0
          ? "Item views metric present without view_item funnel event."
          : "No view_item or item view signals detected.",
      businessImpact: "Product-level diagnostics and UX funnel require item events.",
      recommendedFix: "Implement view_item on product detail pages in GA4.",
      owner: "Tracking owner",
      priority: hasViewItem ? "info" : "warning",
      category: "collection",
    },
    {
      id: "conversion_events",
      label: "Conversion events active",
      status: statusFromFlags(
        hasPurchase,
        input.analytics.transactions === 0 && input.hasAnalytics,
      ),
      evidence: hasPurchase
        ? "purchase event or transactions are present."
        : "No purchase events or transactions in the synced period.",
      businessImpact: "Revenue and funnel completion cannot be trusted.",
      recommendedFix: "Validate purchase event and ecommerce parameters in GA4.",
      owner: "Tracking owner",
      priority: hasPurchase ? "info" : "critical",
      category: "collection",
    },
    {
      id: "missing_recent_data",
      label: "Recent data available",
      status: syncStale ? "warning" : input.uxRecordedAt || input.lastSync ? "ok" : "unknown",
      evidence: input.lastSync?.finishedAt
        ? `Last sync ${input.lastSync.finishedAt} (${input.lastSync.status}).`
        : "No sync logs found for this client.",
      businessImpact: "Stale data can hide tracking breaks until late.",
      recommendedFix: "Run Sync now and confirm sync schedule is enabled.",
      owner: "Ops",
      priority: syncStale ? "warning" : "info",
      category: "sync",
    },
    {
      id: "event_volume_anomaly",
      label: "Event volume anomaly (7v7)",
      status: "unknown",
      evidence: computeAnomalyReadiness(input.syncHistoryCount).message,
      businessImpact: "Sudden volume drops can indicate tag failures or traffic shifts.",
      recommendedFix: "Continue daily syncs; anomaly checks activate after enough history.",
      owner: "Data lead",
      priority: "info",
      category: "anomaly",
    },
    {
      id: "traffic_contamination",
      label: "Traffic attribution quality",
      status:
        sessionNotSetRate > 10
          ? "error"
          : sessionNotSetRate > 5
            ? "warning"
            : input.analytics.sessions > 0
              ? "ok"
              : "unknown",
      evidence:
        input.analytics.sessions > 0
          ? `${sessionNotSetRate.toFixed(1)}% of sessions lack source/medium.`
          : "No session volume to evaluate attribution.",
      businessImpact: "Channel and campaign reporting may be incomplete.",
      recommendedFix: "Audit UTM usage, referral exclusions, and GA4 default channel groups.",
      owner: "Marketing ops",
      priority: sessionNotSetRate > 5 ? "warning" : "info",
      category: "attribution",
    },
    {
      id: "sync_health",
      label: "Sync health",
      status: syncOk ? "ok" : input.lastSync ? "error" : "unknown",
      evidence: input.lastSync
        ? `Latest sync status: ${input.lastSync.status}${input.lastSync.message ? ` — ${input.lastSync.message}` : ""}`
        : "No sync history available.",
      businessImpact: "Failed syncs mean the hub is showing outdated evidence.",
      recommendedFix: "Open Integrations, reconnect if needed, and rerun sync.",
      owner: "Ops",
      priority: syncOk ? "info" : "warning",
      category: "sync",
    },
    {
      id: "permissions",
      label: "Permissions & sync enabled",
      status: analyticsSyncOn || input.hasGtm ? "ok" : input.hasAnalytics ? "warning" : "unknown",
      evidence: analyticsSyncOn
        ? "Analytics sync is enabled on at least one data source."
        : input.hasAnalytics
          ? "Analytics is connected but sync may be disabled."
          : "No analytics source to evaluate.",
      businessImpact: "Disabled sync or missing permissions block recurring monitoring.",
      recommendedFix: "Enable sync on client data sources and verify OAuth scopes.",
      owner: "Admin",
      priority: analyticsSyncOn ? "info" : "warning",
      category: "sync",
    },
  ];

  const { readiness } = computeAnomalyReadiness(input.syncHistoryCount);
  if (readiness === "ready" && input.baselineDeltas && input.baselineDeltas.length > 0) {
    const sessionDelta = input.baselineDeltas.find((row) => row.metricKey === "sessions");
    const txnDelta = input.baselineDeltas.find((row) => row.metricKey === "transactions");
    const worstDelta = [sessionDelta, txnDelta]
      .filter(Boolean)
      .sort((a, b) => (a!.deltaPct ?? 0) - (b!.deltaPct ?? 0))[0];

    if (worstDelta && worstDelta.deltaPct <= -50) {
      checks[6] = {
        ...checks[6],
        status: "error",
        evidence: `${worstDelta.metricKey} dropped ${Math.abs(worstDelta.deltaPct).toFixed(0)}% vs 7 syncs ago (${worstDelta.baseline} → ${worstDelta.current}).`,
        priority: "critical",
      };
    } else if (worstDelta && worstDelta.deltaPct <= -30) {
      checks[6] = {
        ...checks[6],
        status: "warning",
        evidence: `${worstDelta.metricKey} dropped ${Math.abs(worstDelta.deltaPct).toFixed(0)}% vs 7 syncs ago (${worstDelta.baseline} → ${worstDelta.current}).`,
        priority: "warning",
      };
    } else {
      checks[6] = {
        ...checks[6],
        status: "ok",
        evidence: "7v7 volume checks passed — no significant drops detected.",
      };
    }
  } else if (readiness === "ready") {
    checks[6] = {
      ...checks[6],
      status: "ok",
      evidence: "History threshold met. Baseline comparison will run on next sync.",
    };
  }

  if (input.hasGtm && input.tagManager.tagsCount > 0) {
    checks.push({
      id: "consent_mode",
      label: "Consent Mode configuration",
      status: "warning",
      evidence: "GTM container has tags loaded; Consent Mode v2 cannot be verified from sync data alone.",
      businessImpact: "Missing consent defaults can inflate metrics or block tags in EEA/UK.",
      recommendedFix: "Audit GTM for Consent Initialization tags and GA4 consent settings in DebugView.",
      owner: "Technical lead",
      priority: "info",
      category: "collection",
    });
  }

  const businessModel = inferBusinessModel(input);
  if (businessModel === "lead_gen" || businessModel === "hybrid") {
    for (const step of LEAD_GEN_EVENTS) {
      const count =
        input.customEvents.find((row) => row.eventName === step.eventName)?.eventCount ?? 0;
      checks.push({
        id: `lead_event_${step.eventName}`,
        label: `Lead event: ${step.label}`,
        status: count > 0 ? "ok" : "warning",
        evidence:
          count > 0 ? `${count} events in period.` : "Lead event not seen in custom events sync.",
        businessImpact: "Lead conversion monitoring depends on form and thank-you page events.",
        recommendedFix: `Implement ${step.eventName} on key conversion pages.`,
        owner: "Tracking owner",
        priority: count > 0 ? "info" : "warning",
        category: "collection",
      });
    }
  }

  return checks;
}

export function buildSchemaItems(
  input: AgencyTrackerInput,
  businessModel: TrackerBusinessModel,
): TrackerSchemaItem[] {
  const funnelByEvent = new Map(input.funnel.map((row) => [row.eventName, row]));
  const items: TrackerSchemaItem[] = [];

  if (businessModel === "ecommerce" || businessModel === "hybrid" || businessModel === "unknown") {
    for (const step of ECOMMERCE_FUNNEL_EVENTS) {
      const row = funnelByEvent.get(step.eventName);
      const users = row?.activeUsers ?? 0;
      items.push({
        id: `event_${step.eventName}`,
        label: step.label,
        group: "ecommerce_event",
        status: users > 0 ? "ok" : "error",
        evidence:
          users > 0
            ? `${users} active users observed in GA4 during the selected period.`
            : input.hasGtm
              ? "Not observed in GA4 during the selected period. A connected GTM container confirms inventory, not that this event fired successfully."
              : "Not observed in the synced GA4 funnel during the selected period.",
        businessImpact: "Missing funnel events break ecommerce diagnostics and leakage estimates.",
        recommendedFix: input.hasGtm
          ? `Validate the ${step.eventName} tag trigger, consent state, payload, and GA4 DebugView delivery.`
          : `Implement and verify ${step.eventName} in GA4/GTM.`,
      });
    }

    const paramChecks: Array<{ id: string; label: string; ok: boolean; evidence: string }> = [
      {
        id: "param_items",
        label: "items[] on key events",
        ok: input.funnel.length > 0 && input.analytics.itemViews > 0,
        evidence:
          input.analytics.itemViews > 0
            ? "Item view metrics suggest item-level data exists."
            : "No item view signals; items[] quality cannot be confirmed.",
      },
      {
        id: "param_currency",
        label: "currency parameter",
        ok: input.analytics.revenue > 0 || input.analytics.transactions > 0,
        evidence:
          input.analytics.revenue > 0
            ? "Revenue metric present in synced analytics."
            : "No revenue in period to validate currency.",
      },
      {
        id: "param_transaction_id",
        label: "transaction_id on purchase",
        ok: (funnelByEvent.get("purchase")?.eventCount ?? 0) > 0,
        evidence:
          (funnelByEvent.get("purchase")?.eventCount ?? 0) > 0
            ? "Purchase events recorded in funnel sync."
            : "No purchase events to validate transaction_id.",
      },
    ];

    for (const param of paramChecks) {
      items.push({
        id: param.id,
        label: param.label,
        group: "ecommerce_param",
        status: param.ok ? "ok" : "warning",
        evidence: param.evidence,
        businessImpact: "Incomplete item or transaction parameters weaken revenue trust.",
        recommendedFix: "Audit GA4 ecommerce tag mapping and DebugView payloads.",
      });
    }

    for (let i = 1; i < ECOMMERCE_FUNNEL_EVENTS.length; i += 1) {
      const prev = funnelByEvent.get(ECOMMERCE_FUNNEL_EVENTS[i - 1].eventName)?.activeUsers ?? 0;
      const curr = funnelByEvent.get(ECOMMERCE_FUNNEL_EVENTS[i].eventName)?.activeUsers ?? 0;
      if (curr > prev && prev > 0) {
        items.push({
          id: `order_${ECOMMERCE_FUNNEL_EVENTS[i].eventName}`,
          label: `Event order: ${ECOMMERCE_FUNNEL_EVENTS[i].label}`,
          group: "ecommerce_param",
          status: "warning",
          evidence: `${ECOMMERCE_FUNNEL_EVENTS[i].label} has more users than the previous step.`,
          businessImpact: "May indicate duplicate events, returning users, or sequencing issues.",
          recommendedFix:
            "Review event timing, session vs user scope, and duplicate transaction handling.",
        });
      }
    }
  }

  if (businessModel === "lead_gen" || businessModel === "hybrid") {
    for (const step of LEAD_GEN_EVENTS) {
      const count =
        input.customEvents.find((row) => row.eventName === step.eventName)?.eventCount ?? 0;
      items.push({
        id: `lead_${step.eventName}`,
        label: step.label,
        group: "lead_gen",
        status: count > 0 ? "ok" : "warning",
        evidence: count > 0 ? `${count} events in period.` : "Event not seen in custom events sync.",
        businessImpact: "Lead conversion monitoring depends on these events.",
        recommendedFix: `Implement ${step.eventName} on forms and thank-you pages.`,
      });
    }
  }

  return items;
}

function checkToIssue(check: TrackerCheck): TrackerIssue | null {
  if (check.status === "ok") return null;
  return {
    id: `issue_${check.id}`,
    severity: check.status === "error" ? "critical" : check.priority,
    title: check.label,
    category: check.category,
    evidence: check.evidence,
    recommendedFix: check.recommendedFix,
    owner: check.owner,
    expectedImpact: check.businessImpact,
    confidence: check.status === "error" ? 85 : 70,
    checkId: check.id,
  };
}

function schemaToIssue(item: TrackerSchemaItem): TrackerIssue | null {
  if (item.status === "ok") return null;
  return {
    id: `issue_${item.id}`,
    severity: item.status === "error" ? "critical" : "warning",
    title: item.label,
    category: "schema",
    evidence: item.evidence,
    recommendedFix: item.recommendedFix,
    owner: "Tracking owner",
    expectedImpact: item.businessImpact,
    confidence: 75,
    checkId: item.id,
  };
}

export function buildTrackerIssues(
  checks: TrackerCheck[],
  schemaItems: TrackerSchemaItem[],
): TrackerIssue[] {
  const issues = [
    ...checks.map(checkToIssue).filter(Boolean),
    ...schemaItems.map(schemaToIssue).filter(Boolean),
  ] as TrackerIssue[];

  const severityOrder: Record<TrackerIssueSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export function buildTrackerEvidence(input: AgencyTrackerInput): TrackerEvidenceItem[] {
  const evidence: TrackerEvidenceItem[] = [];

  for (const row of input.funnel) {
    evidence.push({
      id: `ga4_${row.eventName}`,
      type: "ga4_event",
      title: row.eventName,
      summary: `${row.activeUsers} active users · ${row.eventCount} events`,
      payload: {
        eventName: row.eventName,
        activeUsers: row.activeUsers,
        eventCount: row.eventCount,
      },
    });
  }

  for (const container of input.tagManager.containers) {
    evidence.push({
      id: `gtm_${container.label}`,
      type: "gtm_container",
      title: container.label,
      summary: `${container.tagsCount} tags · v${container.publishedVersionId || "—"}`,
      payload: {
        tags: container.tagsCount,
        triggers: container.triggersCount,
        variables: container.variablesCount,
        version: container.publishedVersionId,
      },
    });
  }

  if (input.lastSync) {
    evidence.push({
      id: "sync_latest",
      type: "sync_log",
      title: "Latest sync",
      summary: `${input.lastSync.status} at ${input.lastSync.finishedAt ?? "—"}`,
      payload: {
        status: input.lastSync.status,
        message: input.lastSync.message,
        startedAt: input.lastSync.startedAt,
        finishedAt: input.lastSync.finishedAt,
      },
    });
  }

  if (input.analytics.sessionsNotSet > 0) {
    evidence.push({
      id: "attr_sessions_not_set",
      type: "attribution_gap",
      title: "Sessions without source/medium",
      summary: `${input.analytics.sessionsNotSet} sessions not set`,
      payload: {
        sessionsNotSet: input.analytics.sessionsNotSet,
        sessions: input.analytics.sessions,
      },
    });
  }

  if (input.analytics.transactionsNotSet > 0) {
    evidence.push({
      id: "attr_txn_not_set",
      type: "attribution_gap",
      title: "Transactions without source/medium",
      summary: `${input.analytics.transactionsNotSet} transactions not set`,
      payload: {
        transactionsNotSet: input.analytics.transactionsNotSet,
        transactions: input.analytics.transactions,
      },
    });
  }

  return evidence;
}

export function computeConfidenceScore(
  checks: TrackerCheck[],
  schemaItems: TrackerSchemaItem[],
): { score: number; label: TrackerOverview["confidenceLabel"] } {
  let score = 100;
  for (const check of checks) {
    if (check.status === "error") score -= 15;
    else if (check.status === "warning") score -= 8;
    else if (check.status === "unknown") score -= 3;
  }
  for (const item of schemaItems) {
    if (item.status === "error") score -= 10;
    else if (item.status === "warning") score -= 5;
  }
  score = Math.max(0, Math.min(100, Math.round(score)));
  const label = score >= 80 ? "trusted" : score >= 55 ? "review" : "at_risk";
  return { score, label };
}

export function buildAgencyTrackerBundle(input: AgencyTrackerInput): AgencyTrackerBundle {
  const businessModel = inferBusinessModel(input);
  const trackingChecks = buildTrackingChecks(input);
  const schemaItems = buildSchemaItems(input, businessModel);
  const issues = buildTrackerIssues(trackingChecks, schemaItems);
  const evidence = buildTrackerEvidence(input);
  const { score, label } = computeConfidenceScore(trackingChecks, schemaItems);
  const { readiness, message } = computeAnomalyReadiness(input.syncHistoryCount);

  const schemaOk = schemaItems.filter((item) => item.status === "ok").length;
  const schemaCoveragePercent =
    schemaItems.length > 0 ? Math.round((schemaOk / schemaItems.length) * 100) : 0;

  const ga4Check = trackingChecks.find((c) => c.id === "ga4_connected");
  const gtmCheck = trackingChecks.find((c) => c.id === "gtm_connected");

  const overview: TrackerOverview = {
    confidenceScore: score,
    confidenceLabel: label,
    ga4Status: ga4Check?.status ?? "unknown",
    gtmStatus: gtmCheck?.status ?? "unknown",
    lastSyncAt: input.lastSync?.finishedAt ?? null,
    lastSyncStatus: input.lastSync?.status ?? null,
    dataFreshnessAt: input.uxRecordedAt ?? input.lastSync?.finishedAt ?? null,
    schemaCoveragePercent,
    criticalIssueCount: issues.filter((i) => i.severity === "critical").length,
    warningIssueCount: issues.filter((i) => i.severity === "warning").length,
    topFixes: issues.slice(0, 3).map((i) => i.recommendedFix),
    anomalyReadiness: readiness,
    anomalyReadinessMessage: message,
    businessModel,
  };

  return {
    overview,
    trackingChecks,
    schemaItems,
    issues,
    evidence,
    baselineDeltas: input.baselineDeltas,
  };
}
