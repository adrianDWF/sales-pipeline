import { Hono } from "hono";
import { z } from "zod";

import { messageResponse } from "../lib/api-response.js";
import { checkRateLimit, rateLimitKey } from "../lib/rate-limit.js";

const webhooks = new Hono();

const LeadWebhookSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(50).optional(),
  company: z.string().max(200).optional(),
  message: z.string().max(5000).optional(),
  source: z.string().max(100).optional(),
  external_id: z.string().max(200).optional(),
});

webhooks.post("/leads", async (c) => {
  const secret = process.env.LEAD_WEBHOOK_SECRET;
  if (!secret) {
    return messageResponse(c, 503, "Lead webhook is not configured");
  }

  const auth = c.req.header("Authorization");
  if (auth !== `Bearer ${secret}`) {
    return messageResponse(c, 401, "Unauthorized");
  }

  const limit = checkRateLimit(rateLimitKey("webhook:leads", c.req.header("x-forwarded-for") ?? "unknown"), 60, 60 * 1000);
  if (!limit.allowed) {
    return messageResponse(c, 429, "Too many requests");
  }

  const body = await c.req.json().catch(() => null);
  const parsed = LeadWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return messageResponse(c, 400, "Invalid lead payload");
  }

  // Phase 1: persist to Supabase `leads` table once migrations are applied.
  return c.json({
    ok: true,
    accepted: parsed.data,
    note: "Lead ingestion endpoint ready — database write comes in Phase 1",
  });
});

export { webhooks };
