import { createHmac, timingSafeEqual } from "node:crypto";

import type { LeadWebhookPayload } from "@sales-pipeline/shared";

function readField(body: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const match = Object.entries(body).find(
      ([field]) => field.toLowerCase() === key.toLowerCase(),
    );
    if (!match) continue;
    const value = match[1];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

export function verifyFramerSignature(
  secret: string,
  submissionId: string,
  payload: Buffer,
  signature: string | undefined,
): boolean {
  if (!signature || signature.length !== 71 || !signature.startsWith("sha256=")) {
    return false;
  }

  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  hmac.update(submissionId);
  const expected = `sha256=${hmac.digest("hex")}`;

  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function mapFramerFormToLead(
  body: Record<string, unknown>,
  submissionId: string,
): LeadWebhookPayload | null {
  const name = readField(body, ["name", "nume", "full_name", "fullname"]);
  const email = readField(body, ["email", "e-mail", "mail"]);
  if (!name || !email) {
    return null;
  }

  const phone = readField(body, ["phone", "telefon", "tel", "mobile"]);
  const website = readField(body, ["website", "site", "url", "company", "website_url"]);
  const message =
    readField(body, ["message", "mesaj", "notes", "comment", "comments"]) ??
    website;

  return {
    name,
    email,
    phone,
    company: website,
    message,
    source: "framer",
    external_id: submissionId,
    form_payload: body,
  };
}
