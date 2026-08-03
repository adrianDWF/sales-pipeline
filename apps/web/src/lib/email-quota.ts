import {
  DEFAULT_EMAIL_MONTHLY_LIMIT,
  EMAIL_QUOTA_WARNING_REMAINING,
  type EmailQuotaSummary,
} from "@sales-pipeline/shared";

import { createClient } from "@/lib/supabase/server";

function getMonthlyLimit() {
  const configured = Number(process.env.EMAIL_MONTHLY_LIMIT);
  if (Number.isFinite(configured) && configured > 0) {
    return configured;
  }

  return DEFAULT_EMAIL_MONTHLY_LIMIT;
}

function getCurrentMonthKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "UTC",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .slice(0, 7);
}

export async function getEmailQuotaSummary(): Promise<EmailQuotaSummary> {
  const supabase = await createClient();
  const limit = getMonthlyLimit();
  const monthKey = getCurrentMonthKey();

  const { data, error } = await supabase.rpc("get_email_send_count");

  if (error) {
    throw new Error(error.message);
  }

  const sent = typeof data === "number" ? data : 0;
  const remaining = Math.max(0, limit - sent);

  return {
    monthKey,
    sent,
    limit,
    remaining,
    isExceeded: remaining < 1,
    isNearLimit: remaining > 0 && remaining <= EMAIL_QUOTA_WARNING_REMAINING,
  };
}

export async function assertCanSendEmail(): Promise<EmailQuotaSummary> {
  const quota = await getEmailQuotaSummary();

  if (quota.isExceeded) {
    throw new Error(
      "Monthly email limit reached. Approval emails are paused until next month.",
    );
  }

  return quota;
}

export async function recordEmailSend() {
  const supabase = await createClient();
  const { error } = await supabase.rpc("increment_email_send");

  if (error) {
    throw new Error(error.message);
  }
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}
