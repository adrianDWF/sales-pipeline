const ECOMMERCE_EVENTS = [
  "view_item",
  "view_item_list",
  "select_item",
  "add_to_cart",
  "remove_from_cart",
  "view_cart",
  "begin_checkout",
  "add_payment_info",
  "add_shipping_info",
  "purchase",
];

const STANDARD_PARAMETERS = [
  "items",
  "transaction_id",
  "affiliation",
  "value",
  "tax",
  "shipping",
  "currency",
  "coupon",
];

function asArray(value) {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

function stringsIn(value, result = []) {
  if (typeof value === "string") result.push(value);
  else if (Array.isArray(value)) value.forEach((item) => stringsIn(item, result));
  else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => stringsIn(item, result));
  }
  return result;
}

function parameterMap(value, result = new Map()) {
  if (Array.isArray(value)) {
    value.forEach((item) => parameterMap(item, result));
  } else if (value && typeof value === "object") {
    if (typeof value.key === "string") {
      const parameterValue = value.value ?? value.stringValue ?? value.list ?? value.map;
      result.set(value.key, parameterValue);
    }
    Object.values(value).forEach((item) => parameterMap(item, result));
  }
  return result;
}

function eventNamesFromText(text) {
  const normalized = String(text || "").toLowerCase();
  return ECOMMERCE_EVENTS.filter((eventName) => {
    const boundary = new RegExp(`(^|[^a-z0-9_])${eventName}([^a-z0-9_]|$)`);
    return boundary.test(normalized);
  });
}

function observedEventMap(input) {
  const rows = Array.isArray(input) ? input : input?.events ?? input?.rows ?? [];
  const result = new Map();
  for (const row of rows) {
    const eventName = typeof row === "string"
      ? row
      : row?.eventName ?? row?.event_name ?? row?.dimensionValues?.[0]?.value;
    if (!eventName) continue;
    const count = typeof row === "string"
      ? null
      : row.eventCount ?? row.event_count ?? row.metricValues?.[0]?.value ?? null;
    result.set(String(eventName), count == null ? null : Number(count));
  }
  return result;
}

function getContainerVersion(input) {
  return input?.containerVersion ?? input?.exportFormatVersion?.containerVersion ?? input ?? {};
}

function detectEventParameters(tag) {
  const found = new Set();
  const known = [...STANDARD_PARAMETERS, "event_id", "unique_event_id", "server_container_url", "user_data"];
  for (const text of stringsIn(tag)) {
    const lower = text.toLowerCase();
    for (const name of known) {
      if (lower === name || lower.includes(name)) found.add(name);
    }
  }
  return [...found];
}

function tagSummary(tag, triggerById) {
  const strings = stringsIn(tag);
  const parameters = parameterMap(tag);
  const name = tag.name ?? "Unnamed tag";
  const joined = strings.join(" ").toLowerCase();
  const eventParameters = detectEventParameters(tag);
  const firingTriggerIds = asArray(tag.firingTriggerId ?? parameters.get("firingTriggerId"));
  const triggers = firingTriggerIds.map(String).map((id) => triggerById.get(id)).filter(Boolean);
  const triggerText = triggers.flatMap((trigger) => stringsIn(trigger));
  const configuredEvents = [...new Set(triggerText.flatMap(eventNamesFromText))];
  const dynamicEventName = strings.some((text) => /\{\{\s*event\s*\}\}/i.test(text));
  const hasServerContainer = eventParameters.includes("server_container_url") || joined.includes("server side");
  const hasSetupTag = joined.includes("setuptag") || tag.setupTag?.length > 0;
  const mode = hasServerContainer ? "server-side" : hasSetupTag ? "client-side" : "unclassified";
  const idStrategy = eventParameters.includes("unique_event_id")
    ? "unique_event_id"
    : eventParameters.includes("event_id") ? "event_id" : null;
  const consent = strings.filter((text) => [
    "ad_storage", "ad_personalization", "ad_user_data", "analytics_storage",
  ].includes(text));

  return {
    name,
    type: tag.type ?? null,
    mode,
    dynamicEventName,
    configuredEvents,
    triggers: triggers.map((trigger) => trigger.name ?? trigger.triggerId ?? "Unnamed trigger"),
    eventParameters,
    missingStandardParameters: STANDARD_PARAMETERS.filter((item) => !eventParameters.includes(item)),
    idStrategy,
    includesUserData: eventParameters.includes("user_data"),
    consentChecks: [...new Set(consent)],
  };
}

function isRelevantTag(tag) {
  const text = stringsIn(tag).join(" ").toLowerCase();
  return text.includes("ga4") || text.includes("google analytics") ||
    ECOMMERCE_EVENTS.some((eventName) => text.includes(eventName));
}

export function auditGtmGa4Pattern(gtmExport, observedEventsInput) {
  const version = getContainerVersion(gtmExport);
  const triggers = asArray(version.trigger);
  const triggerById = new Map(triggers.map((trigger) => [String(trigger.triggerId), trigger]));
  const tags = asArray(version.tag).filter(isRelevantTag).map((tag) => tagSummary(tag, triggerById));
  const configuredEvents = [...new Set(tags.flatMap((tag) => tag.configuredEvents))];
  const observedEvents = observedEventMap(observedEventsInput);
  const eventUniverse = new Set([...ECOMMERCE_EVENTS, ...configuredEvents]);
  const eventCoverage = [...eventUniverse].map((eventName) => {
    const configured = configuredEvents.includes(eventName);
    const observed = observedEvents.has(eventName);
    return {
      eventName,
      configured,
      observed: observedEventsInput == null ? null : observed,
      eventCount: observedEvents.get(eventName) ?? null,
      status: observedEventsInput == null
        ? (configured ? "configured_unverified" : "not_configured")
        : observed
          ? (configured ? "configured_and_observed" : "observed_not_explicitly_configured")
          : (configured ? "configured_not_observed" : "not_configured_or_observed"),
    };
  });

  return {
    container: {
      name: version.container?.name ?? gtmExport?.containerVersion?.container?.name ?? null,
      publicId: version.container?.publicId ?? null,
    },
    interpretation: "GTM configuration proves intent, not delivery. GA4 observation is required to confirm that an event fired and was collected.",
    patterns: {
      hasServerSide: tags.some((tag) => tag.mode === "server-side"),
      hasClientSide: tags.some((tag) => tag.mode === "client-side"),
      idStrategies: [...new Set(tags.map((tag) => tag.idStrategy).filter(Boolean))],
      configuredEvents,
    },
    tags,
    eventCoverage,
    warnings: [
      ...(tags.some((tag) => tag.dynamicEventName && tag.configuredEvents.length === 0)
        ? ["Dynamic event name detected, but no ecommerce event regex could be resolved from linked triggers."]
        : []),
      ...(tags.some((tag) => tag.mode === "server-side") && tags.some((tag) => tag.mode === "client-side") &&
          !tags.some((tag) => tag.idStrategy)
        ? ["Client/server paths are present without a detectable event identifier used for deduplication."]
        : []),
    ],
  };
}

export { ECOMMERCE_EVENTS, STANDARD_PARAMETERS };
