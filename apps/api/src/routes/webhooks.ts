import { Hono } from "hono";

import { LeadWebhookPayloadSchema, buildDefaultTasksForStage, type LeadWebhookPayload } from "@sales-pipeline/shared";

import { messageResponse } from "../lib/api-response.js";
import { mapFramerFormToLead, verifyFramerSignature } from "../lib/framer-webhook.js";
import { checkRateLimit, rateLimitKey } from "../lib/rate-limit.js";
import { createAdminClient } from "../lib/supabase.js";

const webhooks = new Hono();

async function saveLead(payload: LeadWebhookPayload, rawBody: Record<string, unknown>) {
  const admin = createAdminClient();

  const row = {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone?.trim() || null,
    company: payload.company?.trim() || null,
    message: payload.message?.trim() || null,
    source: payload.source?.trim() || "website",
    external_id: payload.external_id?.trim() || null,
    form_payload: payload.form_payload ?? rawBody,
    status: "new_lead" as const,
  };

  if (row.external_id) {
    const { data: existing } = await admin
      .from("leads")
      .select("id")
      .eq("external_id", row.external_id)
      .maybeSingle();

    if (existing) {
      return { ok: true as const, id: existing.id, duplicate: true };
    }
  }

  const { data, error } = await admin.from("leads").insert(row).select("id").single();

  if (error) {
    if (error.code === "23505" && row.external_id) {
      const { data: existing } = await admin
        .from("leads")
        .select("id")
        .eq("external_id", row.external_id)
        .single();
      return { ok: true as const, id: existing?.id, duplicate: true };
    }
    console.error("Lead webhook insert failed:", error.message);
    throw error;
  }

  const defaultTasks = buildDefaultTasksForStage("new_lead").map((task) => ({
    ...task,
    lead_id: data.id,
  }));

  const { error: tasksError } = await admin.from("lead_tasks").insert(defaultTasks);
  if (tasksError) {
    console.error("Lead webhook default tasks insert failed:", tasksError.message);
  }

  return { ok: true as const, id: data.id, duplicate: false };
}

webhooks.post("/leads", async (c) => {
  const secret = process.env.LEAD_WEBHOOK_SECRET;
  if (!secret) {
    return messageResponse(c, 503, "Lead webhook is not configured");
  }

  const auth = c.req.header("Authorization");
  if (auth !== `Bearer ${secret}`) {
    return messageResponse(c, 401, "Unauthorized");
  }

  const limit = checkRateLimit(
    rateLimitKey("webhook:leads", c.req.header("x-forwarded-for") ?? "unknown"),
    60,
    60 * 1000,
  );
  if (!limit.allowed) {
    return messageResponse(c, 429, "Too many requests");
  }

  const body = await c.req.json().catch(() => null);
  const parsed = LeadWebhookPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return messageResponse(c, 400, "Invalid lead payload");
  }

  try {
    return c.json(await saveLead(parsed.data, (body as Record<string, unknown>) ?? {}));
  } catch {
    return messageResponse(c, 500, "Failed to save lead");
  }
});

webhooks.post("/framer", async (c) => {
  const secret = process.env.FRAMER_WEBHOOK_SECRET ?? process.env.LEAD_WEBHOOK_SECRET;
  if (!secret) {
    return messageResponse(c, 503, "Framer webhook is not configured");
  }

  const limit = checkRateLimit(
    rateLimitKey("webhook:framer", c.req.header("x-forwarded-for") ?? "unknown"),
    60,
    60 * 1000,
  );
  if (!limit.allowed) {
    return messageResponse(c, 429, "Too many requests");
  }

  const rawBody = Buffer.from(await c.req.arrayBuffer());
  const signature = c.req.header("Framer-Signature");
  const submissionId = c.req.header("Framer-Webhook-Submission-Id");

  if (!submissionId || !verifyFramerSignature(secret, submissionId, rawBody, signature)) {
    return messageResponse(c, 401, "Invalid Framer signature");
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
  } catch {
    return messageResponse(c, 400, "Invalid JSON payload");
  }

  const mapped = mapFramerFormToLead(body, submissionId);
  if (!mapped) {
    return messageResponse(c, 400, "Missing required fields: name and email");
  }

  const parsed = LeadWebhookPayloadSchema.safeParse(mapped);
  if (!parsed.success) {
    return messageResponse(c, 400, "Invalid lead payload");
  }

  try {
    return c.json(await saveLead(parsed.data, body));
  } catch {
    return messageResponse(c, 500, "Failed to save lead");
  }
});

export { webhooks };
