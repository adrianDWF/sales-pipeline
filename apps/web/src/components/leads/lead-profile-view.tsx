"use client";

import type { LeadDetail, LeadStatus } from "@sales-pipeline/shared";
import Link from "next/link";

import { LeadLegalPanel } from "@/components/leads/lead-legal-panel";
import { LeadMeetingsPanel } from "@/components/leads/lead-meetings-panel";
import { LeadNotesPanel } from "@/components/leads/lead-notes-panel";
import { LeadOfferPanel } from "@/components/leads/lead-offer-panel";
import { LeadProfileForm } from "@/components/leads/lead-profile-form";
import { LeadProfileHeader } from "@/components/leads/lead-profile-header";
import { LeadStageTasks } from "@/components/leads/lead-stage-tasks";
import { LeadTimeline } from "@/components/leads/lead-timeline";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AssignableUser } from "@/lib/leads";

export function LeadProfileView({
  lead,
  assignableUsers,
  canManageAll,
  currentUserId,
  isSuperUser: canManageNotesAsSuperUser,
}: {
  lead: LeadDetail;
  assignableUsers: AssignableUser[];
  canManageAll: boolean;
  currentUserId: string;
  isSuperUser: boolean;
}) {
  const status = lead.status as LeadStatus;
  const tasks = lead.lead_tasks ?? [];

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
        <Link href="/leads">← Înapoi la pipeline</Link>
      </Button>

      <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1 space-y-5">
          <LeadProfileHeader lead={lead} />

          <Tabs defaultValue="profil">
            <TabsList>
              <TabsTrigger value="profil">Profil</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="meetings">Meetings</TabsTrigger>
              <TabsTrigger value="offer">Offer</TabsTrigger>
              <TabsTrigger value="legal">Legal</TabsTrigger>
            </TabsList>
            <TabsContent value="profil" className="mt-4">
              <LeadProfileForm
                lead={lead}
                assignableUsers={assignableUsers}
                canManageAll={canManageAll}
              />
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
              <LeadNotesPanel
                leadId={lead.id}
                notes={lead.lead_notes ?? []}
                currentUserId={currentUserId}
                isSuperUser={canManageNotesAsSuperUser}
              />
            </TabsContent>
            <TabsContent value="meetings" className="mt-4">
              <LeadMeetingsPanel leadId={lead.id} meetings={lead.lead_meetings ?? []} />
            </TabsContent>
            <TabsContent value="offer" className="mt-4">
              <LeadOfferPanel leadId={lead.id} offers={lead.lead_offers ?? []} />
            </TabsContent>
            <TabsContent value="legal" className="mt-4">
              <LeadLegalPanel leadId={lead.id} legalItems={lead.lead_legal ?? []} />
            </TabsContent>
          </Tabs>
        </div>

        <aside className="w-full shrink-0 xl:w-72">
          <LeadTimeline currentStatus={status} />
          <LeadStageTasks leadId={lead.id} stage={status} tasks={tasks} />
        </aside>
      </div>
    </div>
  );
}
