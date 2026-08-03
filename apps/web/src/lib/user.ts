import type { User } from "@supabase/supabase-js";

export function getUserDisplayName(user: User) {
  const metadata = user.user_metadata ?? {};
  return (
    (metadata.full_name as string | undefined) ||
    (metadata.name as string | undefined) ||
    user.email?.split("@")[0] ||
    "User"
  );
}

export function getUserAvatar(user: User) {
  const metadata = user.user_metadata ?? {};
  return (
    (metadata.avatar_url as string | undefined) ||
    (metadata.picture as string | undefined) ||
    undefined
  );
}

export function getUserInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
