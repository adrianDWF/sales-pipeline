import { Clock3, ShieldX } from "lucide-react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getUserDisplayName } from "@/lib/user";

async function signOutAction() {
  "use server";

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function PermissionApprovalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/permission-approval");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, approval_status, is_system_admin")
    .eq("id", user.id)
    .single();

  const isRejected = profile?.approval_status === "rejected";
  const isOnHold = profile?.approval_status === "pending_on_hold";

  if (profile?.approval_status === "approved" || profile?.is_system_admin) {
    redirect("/dashboard");
  }

  const displayName = getUserDisplayName(user);

  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-4">
          <div
            className={`flex size-12 items-center justify-center rounded-full ${
              isRejected ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground"
            }`}
          >
            {isRejected ? <ShieldX className="size-6" /> : <Clock3 className="size-6" />}
          </div>
          <div>
            <CardTitle>Permission Approval</CardTitle>
            <CardDescription>
              {isRejected
                ? "Your account request was reviewed and not approved."
                : "Your account is waiting for administrator approval before you can access Sales Pipeline."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {profile?.email ?? user.email}
            </p>
          </div>

          {isRejected ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              If you think this was a mistake, contact your workspace administrator
              to request access again.
            </p>
          ) : isOnHold ? (
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your request is queued, but account review is temporarily paused
              because the workspace email limit has been reached. You will be
              notified by email once an administrator can process your request.
            </p>
          ) : (
            <p className="text-muted-foreground text-sm leading-relaxed">
              A super admin will review your request. You will receive an email once
              your account has been approved or rejected.
            </p>
          )}

          <form action={signOutAction}>
            <Button type="submit" variant="outline" className="w-full">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
