import type { SupabaseClient } from "@supabase/supabase-js";

const LOCK_RETRY_MS = 400;
const LOCK_MAX_ATTEMPTS = 8;

export function isAccessTokenFresh(
  connection: { access_token: string; token_expires_at: string | null },
  bufferMs = 5 * 60 * 1000,
): boolean {
  const expiresAt = connection.token_expires_at
    ? new Date(connection.token_expires_at).getTime()
    : 0;
  return Boolean(connection.access_token) && Date.now() < expiresAt - bufferMs;
}

async function tryAcquireRefreshLock(
  supabase: SupabaseClient,
  connectionId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("acquire_connection_refresh_lock", {
    p_connection_id: connectionId,
  });
  if (error) {
    return true;
  }
  return data === true;
}

async function releaseRefreshLock(
  supabase: SupabaseClient,
  connectionId: string,
): Promise<void> {
  await supabase.rpc("release_connection_refresh_lock", {
    p_connection_id: connectionId,
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withConnectionRefreshLock<T>(
  supabase: SupabaseClient,
  connectionId: string,
  run: () => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt < LOCK_MAX_ATTEMPTS; attempt += 1) {
    const acquired = await tryAcquireRefreshLock(supabase, connectionId);
    if (acquired) {
      try {
        return await run();
      } finally {
        await releaseRefreshLock(supabase, connectionId);
      }
    }
    await sleep(LOCK_RETRY_MS);
  }

  return run();
}
