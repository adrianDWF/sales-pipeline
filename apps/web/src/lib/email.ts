import { Resend } from "resend";

import {
  assertCanSendEmail,
  isEmailConfigured,
  recordEmailSend,
} from "@/lib/email-quota";

type AccountEmailInput = {
  to: string;
  name?: string | null;
};

type SendResult = {
  sent: boolean;
  skippedReason?: string;
};

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  return new Resend(apiKey);
}

function getFromAddress() {
  return process.env.EMAIL_FROM ?? "Sales Pipeline <onboarding@resend.dev>";
}

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://sales-pipeline-web.vercel.app";
}

async function sendTransactionalEmail({
  to,
  subject,
  html,
}: Omit<AccountEmailInput, "name"> & {
  subject: string;
  html: string;
}): Promise<SendResult> {
  if (!isEmailConfigured()) {
    console.warn("RESEND_API_KEY is not set; skipping transactional email.");
    return { sent: false, skippedReason: "email_not_configured" };
  }

  await assertCanSendEmail();

  const resend = getResendClient();
  if (!resend) {
    return { sent: false, skippedReason: "email_not_configured" };
  }

  await resend.emails.send({
    from: getFromAddress(),
    to,
    subject,
    html,
  });

  await recordEmailSend();

  return { sent: true };
}

export async function sendAccountApprovedEmail({
  to,
  name,
}: AccountEmailInput) {
  const displayName = name?.trim() || "there";

  return sendTransactionalEmail({
    to,
    subject: "Your Sales Pipeline account has been approved",
    html: `
      <p>Hi ${displayName},</p>
      <p>Your Sales Pipeline account has been approved. You can now sign in and access the workspace.</p>
      <p><a href="${getAppUrl()}/login">Sign in to Sales Pipeline</a></p>
    `,
  });
}

export async function sendAccountRejectedEmail({
  to,
  name,
}: AccountEmailInput) {
  const displayName = name?.trim() || "there";

  return sendTransactionalEmail({
    to,
    subject: "Your Sales Pipeline account request was not approved",
    html: `
      <p>Hi ${displayName},</p>
      <p>Your request for access to Sales Pipeline was not approved at this time.</p>
      <p>If you believe this was a mistake, please contact your workspace administrator.</p>
    `,
  });
}

export async function sendUserInviteEmail({
  to,
  name,
}: AccountEmailInput) {
  const displayName = name?.trim() || "there";

  return sendTransactionalEmail({
    to,
    subject: "You've been invited to Sales Pipeline",
    html: `
      <p>Hi ${displayName},</p>
      <p>You have been invited to join Sales Pipeline. Check your email for a link to set your password and sign in.</p>
      <p><a href="${getAppUrl()}/login">Sign in to Sales Pipeline</a></p>
    `,
  });
}
