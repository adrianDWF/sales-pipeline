import { redirect } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import {
  getUserAvatar,
  getUserDisplayName,
  getUserInitials,
} from "@/lib/user";

import { ProfileAccountCardHeader, ProfilePageHeader } from "./profile-page-header";

function formatMetadataValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/profile");
  }

  const displayName = getUserDisplayName(user);
  const avatarUrl = getUserAvatar(user);
  const metadata = user.user_metadata ?? {};
  const metadataEntries = Object.entries(metadata).filter(
    ([key]) => !["avatar_url", "picture", "full_name", "name"].includes(key),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <ProfilePageHeader />

        <Card>
          <ProfileAccountCardHeader />
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={displayName} />
                ) : null}
                <AvatarFallback className="text-lg">
                  {getUserInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-lg font-semibold">{displayName}</p>
                <p className="text-muted-foreground truncate text-sm">
                  {user.email}
                </p>
              </div>
            </div>

            <Separator />

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-sm">User ID</dt>
                <dd className="mt-1 truncate font-mono text-sm">{user.id}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">Provider</dt>
                <dd className="mt-1 text-sm capitalize">
                  {user.app_metadata?.provider ?? "email"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">Created</dt>
                <dd className="mt-1 text-sm">
                  {user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-sm">Last sign in</dt>
                <dd className="mt-1 text-sm">
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString()
                    : "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {metadataEntries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Profile metadata</CardTitle>
              <CardDescription>
                Additional information from your authentication provider.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                {metadataEntries.map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-muted-foreground text-sm capitalize">
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd className="mt-1 text-sm break-words whitespace-pre-wrap">
                      {formatMetadataValue(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}
      </div>
  );
}
