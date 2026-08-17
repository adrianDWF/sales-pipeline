import { NextResponse } from "next/server";

import { buildGmailAuthUrl, isGmailOAuthConfigured } from "@/lib/gmail/config";
import { createGmailOAuthState } from "@/lib/gmail/oauth-state";
import { createClient } from "@/lib/supabase/server";

function sanitizeRedirectPath(value: string | null, leadId: string | null): string {
  if (value?.startsWith("/")) {
    return value;
  }
  if (leadId) {
    return `/leads/${leadId}?tab=comunicari`;
  }
  return "/leads";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get("leadId");
  const redirect = sanitizeRedirectPath(searchParams.get("redirect"), leadId);

  if (!isGmailOAuthConfigured()) {
    const target = new URL(redirect, request.url);
    target.searchParams.set("gmail", "not_configured");
    return NextResponse.redirect(target);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", `/api/auth/gmail/connect?leadId=${leadId ?? ""}`);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const state = await createGmailOAuthState(user.id, redirect);
    return NextResponse.redirect(buildGmailAuthUrl(state));
  } catch (error) {
    const target = new URL(redirect, request.url);
    target.searchParams.set(
      "gmail",
      error instanceof Error ? error.message : "connect_failed",
    );
    return NextResponse.redirect(target);
  }
}
