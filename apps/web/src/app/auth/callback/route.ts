import { NextResponse } from "next/server";

import { getGmailAutoConnectUrl } from "@/lib/gmail/auto-connect";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let redirect = searchParams.get("redirect") ?? "/dashboard";

  if (!redirect.startsWith("/")) {
    redirect = "/dashboard";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("approval_status, is_system_admin")
          .eq("id", user.id)
          .single();

        const isApproved =
          profile?.is_system_admin || profile?.approval_status === "approved";

        if (!isApproved) {
          redirect = "/permission-approval";
        } else {
          const autoConnectUrl = await getGmailAutoConnectUrl(user, redirect, origin);
          if (autoConnectUrl) {
            return NextResponse.redirect(autoConnectUrl);
          }
        }
      }

      return NextResponse.redirect(`${origin}${redirect}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
