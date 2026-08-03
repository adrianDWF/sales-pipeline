"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

export function ManualSeoSyncButton({
  clientId,
  websiteId,
  onSynced,
}: {
  clientId?: string;
  websiteId?: string;
  onSynced?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageIsError, setMessageIsError] = useState(false);
  const [usage, setUsage] = useState<{
    used: number;
    limit: number | null;
    remaining: number | null;
  } | null>(null);

  useEffect(() => {
    async function loadUsage() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const result = await apiFetch<{
          used: number;
          limit: number | null;
          remaining: number | null;
        }>("/seo/sync/usage", { token: session.access_token });

        setUsage(result);
      } catch {
        // ignore usage load errors
      }
    }

    void loadUsage();
  }, []);

  async function handleSync() {
    setLoading(true);
    setMessage("Syncing… this usually takes 15–30 seconds.");
    setMessageIsError(false);

    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setMessage("Sign in required");
        setMessageIsError(true);
        return;
      }

      const result = await apiFetch<{
        message: string;
        remaining: number | null;
      }>("/seo/sync/manual", {
        method: "POST",
        token: session.access_token,
        body: JSON.stringify({ clientId, websiteId }),
      });

      setMessage(result.message ?? "Sync complete");
      onSynced?.();

      if (result.remaining !== undefined) {
        setUsage((prev) =>
          prev
            ? {
                ...prev,
                remaining: result.remaining,
                used: prev.limit === null ? prev.used : prev.limit - (result.remaining ?? 0),
              }
            : prev,
        );
      }
    } catch (err) {
      setMessageIsError(true);
      setMessage(err instanceof Error ? err.message : "SEO sync failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleSync} disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          {loading ? "Syncing…" : "Sync SEO data"}
        </Button>
        {usage && usage.limit !== null && !loading && (
          <span className="text-muted-foreground text-xs">
            {usage.remaining ?? 0} manual syncs left today
          </span>
        )}
      </div>
      {message && (
        <p
          className={
            messageIsError
              ? "text-destructive max-w-md text-right text-sm"
              : "text-muted-foreground max-w-md text-right text-sm"
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}
