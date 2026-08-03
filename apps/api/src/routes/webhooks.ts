import { Hono } from "hono";

import { LeadWebhookPayloadSchema } from "@sales-pipeline/shared";

import { messageResponse } from "../lib/api-response.js";
import { checkRateLimit, rateLimitKey } from "../lib/rate-limit.js";
import { createAdminClient } from "../lib/supabase.js";

const webhooks = new Hono();

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

  const payload = parsed.data;
  const admin = createAdminClient();

  const row = {
    name: payload.name.trim(),
    email: payload.email.trim().toLowerCase(),
    phone: payload.phone?.trim() || null,
    company: payload.company?.trim() || null,
    message: payload.message?.trim() || null,
    source: payload.source?.trim() || "website",
    external_id: payload.external_id?.trim() || null,
    form_payload: payload.form_payload ?? body ?? {},
    status: "new" as const,
  };

  if (row.external_id) {
    const { data: existing } = await admin
      .from("leads")
      .select("id")
      .eq("external_id", row.external_id)
      .maybeSingle();

    if (existing) {
      return c.json({ ok: true, id: existing.id, duplicate: true });
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
      return c.json({ ok: true, id: existing?.id, duplicate: true });
    }
    console.error("Lead webhook insert failed:", error.message);
    return messageResponse(c, 500, "Failed to save lead");
  }

  return c.json({ ok: true, id: data.id, duplicate: false });
});

export { webhooks };
