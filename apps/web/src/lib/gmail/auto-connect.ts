import type { User } from "@supabase/supabase-js";

import { getGmailConnectionForUser } from "./connections";
import { isExcludedGmailEmail, isGmailOAuthConfigured } from "./config";

export function isGoogleAuthUser(user: User): boolean {
  if (user.app_metadata?.provider === "google") {
    return true;
  }

  return user.identities?.some((identity) => identity.provider === "google") ?? false;
}

export async function getGmailAutoConnectUrl(
  user: User,
  redirectPath: string,
  origin: string,
): Promise<string | null> {
  if (!isGmailOAuthConfigured()) {
    return null;
  }

  if (!isGoogleAuthUser(user)) {
    return null;
  }

  if (!user.email || isExcludedGmailEmail(user.email)) {
    return null;
  }

  const existing = await getGmailConnectionForUser(user.id);
  if (existing) {
    return null;
  }

  const url = new URL("/api/auth/gmail/connect", origin);
  url.searchParams.set("redirect", redirectPath);
  url.searchParams.set("auto", "1");
  return url.toString();
}
