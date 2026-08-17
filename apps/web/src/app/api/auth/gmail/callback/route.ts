import { NextResponse } from "next/server";

import {
  exchangeGmailAuthCode,
  fetchGoogleAccountEmail,
  isExcludedGmailEmail,
  parseScopes,
} from "@/lib/gmail/config";
import { consumeGmailOAuthState } from "@/lib/gmail/oauth-state";
import { upsertGmailConnection } from "@/lib/gmail/connections";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  let redirectPath = "/leads";

  if (oauthError) {
    const target = new URL(redirectPath, request.url);
    target.searchParams.set("gmail", oauthError);
    return NextResponse.redirect(target);
  }

  if (!code || !state) {
    const target = new URL(redirectPath, request.url);
    target.searchParams.set("gmail", "missing_code");
    return NextResponse.redirect(target);
  }

  try {
    const consumed = await consumeGmailOAuthState(state);
    redirectPath = consumed.redirectPath;

    const tokens = await exchangeGmailAuthCode(code);
    if (!tokens.refresh_token) {
      throw new Error("missing_refresh_token");
    }

    const googleEmail = await fetchGoogleAccountEmail(tokens.access_token);
    if (isExcludedGmailEmail(googleEmail)) {
      throw new Error("excluded_account");
    }

    await upsertGmailConnection({
      userId: consumed.userId,
      googleEmail,
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in,
      scopes: parseScopes(tokens.scope),
    });

    const target = new URL(redirectPath, request.url);
    target.searchParams.set("gmail", "connected");
    return NextResponse.redirect(target);
  } catch (error) {
    const target = new URL(redirectPath, request.url);
    target.searchParams.set(
      "gmail",
      error instanceof Error ? error.message : "callback_failed",
    );
    return NextResponse.redirect(target);
  }
}
