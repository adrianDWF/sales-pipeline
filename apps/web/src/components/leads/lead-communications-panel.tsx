"use client";

import type { GmailConnectionStatus, LeadCommunication } from "@sales-pipeline/shared";
import { format } from "date-fns";
import { Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import {
  getGmailConnectionStatusAction,
  getLeadCommunicationsAction,
} from "@/app/(app)/leads/communications-actions";
import { Button } from "@/components/ui/button";

function formatEmailDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return format(parsed, "d MMM yyyy, HH:mm");
}

function EmailCard({ email }: { email: LeadCommunication }) {
  const [expanded, setExpanded] = useState(false);
  const preview = email.body.trim() || email.snippet || "";

  return (
    <li className="bg-card rounded-xl border p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{email.subject}</p>
          <p className="text-muted-foreground mt-1 text-xs">
            De la: {email.from || "—"}
          </p>
          <p className="text-muted-foreground text-xs">
            Către: {email.to.length > 0 ? email.to.join(", ") : "—"}
          </p>
          <p className="text-muted-foreground text-xs">
            Cont echipă: {email.mailboxEmail}
          </p>
        </div>
        <p className="text-muted-foreground shrink-0 text-xs">
          {formatEmailDate(email.date)}
        </p>
      </div>
      {preview ? (
        <div className="mt-3">
          <p className={`text-sm whitespace-pre-wrap ${expanded ? "" : "line-clamp-4"}`}>
            {preview}
          </p>
          {preview.length > 240 ? (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="mt-1 h-auto px-0"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Ascunde" : "Arată tot"}
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function LeadCommunicationsPanel({ leadId }: { leadId: string }) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [communications, setCommunications] = useState<LeadCommunication[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gmailStatus, setGmailStatus] = useState<GmailConnectionStatus>({
    connected: false,
    googleEmail: null,
    connectedAt: null,
  });

  const gmailNotice = searchParams.get("gmail");

  function loadCommunications() {
    startTransition(async () => {
      setError(null);
      const result = await getLeadCommunicationsAction(leadId);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setCommunications(result.communications);
      setWarning(result.warning ?? null);
      setGmailStatus(result.gmailStatus);
    });
  }

  useEffect(() => {
    loadCommunications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, gmailNotice]);

  useEffect(() => {
    if (!gmailNotice) return;
    startTransition(async () => {
      const status = await getGmailConnectionStatusAction();
      if (!("error" in status)) {
        setGmailStatus(status);
      }
    });
  }, [gmailNotice]);

  const connectHref = `/api/auth/gmail/connect?leadId=${encodeURIComponent(leadId)}`;

  return (
    <div className="space-y-4">
      <div className="bg-muted/40 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Mail className="text-muted-foreground mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Gmail conectat</p>
            {gmailStatus.connected ? (
              <p className="text-muted-foreground text-sm">
                {gmailStatus.googleEmail}
                {gmailStatus.connectedAt
                  ? ` · conectat ${formatEmailDate(gmailStatus.connectedAt)}`
                  : null}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Conectează contul tău Gmail pentru a include emailurile tale în comunicările
                echipei.
              </p>
            )}
          </div>
        </div>
        {!gmailStatus.connected ? (
          <Button asChild size="sm" className="shrink-0">
            <Link href={connectHref}>Conectează Gmail</Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <Link href={connectHref}>Reconectează</Link>
          </Button>
        )}
      </div>

      {gmailNotice === "connected" ? (
        <p className="text-sm text-emerald-700">Gmail conectat cu succes.</p>
      ) : null}
      {gmailNotice === "not_configured" ? (
        <p className="text-destructive text-sm">
          Integrarea Gmail nu este configurată pe server.
        </p>
      ) : null}
      {gmailNotice && !["connected", "not_configured"].includes(gmailNotice) ? (
        <p className="text-destructive text-sm">Eroare Gmail: {gmailNotice}</p>
      ) : null}

      {warning ? <p className="text-muted-foreground text-sm">{warning}</p> : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {isPending && communications.length === 0 ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Se încarcă comunicările…
        </div>
      ) : null}

      {!isPending && communications.length === 0 && !error ? (
        <p className="text-muted-foreground text-sm">
          Nu s-au găsit emailuri pentru acest lead.
        </p>
      ) : null}

      {communications.length > 0 ? (
        <ul className="space-y-3">
          {communications.map((email) => (
            <EmailCard key={`${email.mailboxEmail}-${email.id}`} email={email} />
          ))}
        </ul>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={loadCommunications}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Reîmprospătează
          </>
        ) : (
          "Reîmprospătează"
        )}
      </Button>
    </div>
  );
}
