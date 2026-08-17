"use client";

import type {
  GmailConnectionStatus,
  LeadCommunication,
  TeamGmailSummary,
} from "@sales-pipeline/shared";
import { format } from "date-fns";
import { CheckCircle2, Circle, Loader2, Mail, Users } from "lucide-react";
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

function formatPersonName(fullName: string | null, email: string) {
  return fullName?.trim() || email;
}

function gmailNoticeMessage(notice: string) {
  switch (notice) {
    case "connected":
      return null;
    case "not_configured":
      return "Integrarea Gmail nu este configurată pe server.";
    case "excluded_account":
      return "Contul tău (dev) nu poate sincroniza Gmail. Vei vedea emailurile colegilor după ce își conectează Gmail.";
    case "missing_refresh_token":
      return "Google nu a returnat token de reîmprospătare. Încearcă «Reconectează Gmail».";
    default:
      return `Eroare Gmail: ${notice}`;
  }
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

function TeamGmailStatus({ teamSummary }: { teamSummary: TeamGmailSummary }) {
  if (teamSummary.connected.length === 0 && teamSummary.pending.length === 0) {
    return null;
  }

  return (
    <div className="bg-muted/40 rounded-xl border p-4">
      <div className="mb-3 flex items-center gap-2">
        <Users className="text-muted-foreground size-4" />
        <p className="text-sm font-medium">Conturi Gmail ale echipei</p>
      </div>
      <ul className="space-y-2 text-sm">
        {teamSummary.connected.map((mailbox) => (
          <li key={mailbox.userId} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <span>
              <span className="font-medium">
                {formatPersonName(mailbox.fullName, mailbox.googleEmail)}
              </span>
              <span className="text-muted-foreground">
                {" "}
                · {mailbox.googleEmail} · conectat {formatEmailDate(mailbox.connectedAt)}
              </span>
            </span>
          </li>
        ))}
        {teamSummary.pending.map((member) => (
          <li key={member.userId} className="flex items-start gap-2">
            <Circle className="text-muted-foreground mt-0.5 size-4 shrink-0" />
            <span>
              <span className="font-medium">{formatPersonName(member.fullName, member.email)}</span>
              <span className="text-muted-foreground">
                {" "}
                · nu a conectat Gmail încă (trebuie să apese «Conectează Gmail» în acest tab)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
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
  const [teamSummary, setTeamSummary] = useState<TeamGmailSummary>({
    connected: [],
    pending: [],
  });
  const [canConnectGmail, setCanConnectGmail] = useState(true);

  const gmailNotice = searchParams.get("gmail");
  const noticeMessage = gmailNotice ? gmailNoticeMessage(gmailNotice) : null;

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
      setTeamSummary(result.teamSummary);
      setCanConnectGmail(result.canConnectGmail);
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
  const showEmptyEmails =
    !isPending && communications.length === 0 && !error && teamSummary.connected.length === 0;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <p className="font-medium">Login cu Google ≠ Conectare Gmail</p>
        <p className="mt-1">
          Autentificarea în app (Continue with Google) doar te loghează. Pentru emailuri, fiecare
          coleg trebuie separat să apese <strong>Conectează Gmail</strong> și să aprobe accesul la
          Gmail. După conectare, toată echipa vede emailurile relevante lead-ului.
        </p>
      </div>

      <TeamGmailStatus teamSummary={teamSummary} />

      <div className="bg-muted/40 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Mail className="text-muted-foreground mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-medium">Contul tău Gmail</p>
            {!canConnectGmail ? (
              <p className="text-muted-foreground text-sm">
                Contul tău nu sincronizează Gmail (exclus ca dev). Poți vedea emailurile colegilor
                după ce își conectează Gmail.
              </p>
            ) : gmailStatus.connected ? (
              <p className="text-muted-foreground text-sm">
                {gmailStatus.googleEmail}
                {gmailStatus.connectedAt
                  ? ` · conectat ${formatEmailDate(gmailStatus.connectedAt)}`
                  : null}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Conectează-ți Gmail ca emailurile tale să apară în comunicările echipei.
              </p>
            )}
          </div>
        </div>
        {canConnectGmail ? (
          !gmailStatus.connected ? (
            <Button asChild size="sm" className="shrink-0">
              <Link href={connectHref}>Conectează Gmail</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link href={connectHref}>Reconectează</Link>
            </Button>
          )
        ) : null}
      </div>

      {gmailNotice === "connected" ? (
        <p className="text-sm text-emerald-700">Gmail conectat cu succes.</p>
      ) : null}
      {noticeMessage ? (
        <p
          className={`text-sm ${gmailNotice === "excluded_account" ? "text-amber-800" : "text-destructive"}`}
        >
          {noticeMessage}
        </p>
      ) : null}

      {warning ? <p className="text-muted-foreground text-sm">{warning}</p> : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}

      {isPending && communications.length === 0 ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Se încarcă comunicările…
        </div>
      ) : null}

      {showEmptyEmails ? (
        <p className="text-muted-foreground text-sm">
          Nu apar emailuri până când cel puțin un coleg conectează Gmail. Irina trebuie să intre
          pe acest lead, tab Comunicări, și să apese Conectează Gmail.
        </p>
      ) : null}

      {!isPending && communications.length === 0 && !error && teamSummary.connected.length > 0 ? (
        <p className="text-muted-foreground text-sm">
          Nu s-au găsit emailuri pentru acest lead în mailbox-urile conectate.
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
