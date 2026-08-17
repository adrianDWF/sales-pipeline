import { NextResponse } from "next/server";

import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { syncAllLeadTermeneProfiles } from "@/lib/termene-sync";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request.headers.get("Authorization") ?? undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllLeadTermeneProfiles();
    return NextResponse.json({ status: "ok", purpose: "termene-weekly-sync", ...result });
  } catch (error) {
    console.error("Termene weekly sync failed:", error);
    return NextResponse.json({ error: "Termene sync failed" }, { status: 503 });
  }
}
