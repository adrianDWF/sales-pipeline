#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { auditGtmGa4Pattern } from "./lib/gtm-ga4-pattern-audit.mjs";

function usage() {
  return `Usage:
  node scripts/gtm-ga4-pattern-audit.mjs --gtm <container-export.json> [--ga4-events <events.json>] [--compact]

The optional GA4 file may be an array of event names, rows containing eventName/eventCount,
or a GA4 Data API response with dimensionValues and metricValues.`;
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(usage());
  process.exit(0);
}

const gtmPath = argument("--gtm");
if (!gtmPath) {
  console.error(usage());
  process.exit(1);
}

try {
  const gtmExport = JSON.parse(await readFile(gtmPath, "utf8"));
  const ga4Path = argument("--ga4-events");
  const observedEvents = ga4Path ? JSON.parse(await readFile(ga4Path, "utf8")) : undefined;
  const result = auditGtmGa4Pattern(gtmExport, observedEvents);
  console.log(JSON.stringify(result, null, process.argv.includes("--compact") ? 0 : 2));
} catch (error) {
  console.error(`Audit failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
