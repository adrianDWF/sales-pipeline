"use client";

import type { LeadMeeting } from "@sales-pipeline/shared";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addLeadMeetingAction, deleteLeadMeetingAction } from "@/app/(app)/leads/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function LeadMeetingsPanel({
  leadId,
  meetings,
}: {
  leadId: string;
  meetings: LeadMeeting[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");

  function add() {
    if (!title.trim()) return;
    startTransition(async () => {
      await addLeadMeetingAction(leadId, {
        title,
        scheduled_at: scheduledAt || null,
        notes: notes || null,
      });
      setTitle("");
      setScheduledAt("");
      setNotes("");
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteLeadMeetingAction(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input placeholder="Titlu meeting" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
      </div>
      <Textarea placeholder="Note" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      <Button type="button" size="sm" disabled={isPending} onClick={add}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Adaugă meeting
      </Button>
      <ul className="space-y-2">
        {meetings.map((m) => (
          <li key={m.id} className="flex items-start justify-between gap-2 rounded-lg border p-3">
            <div>
              <p className="font-medium text-sm">{m.title}</p>
              {m.scheduled_at ? (
                <p className="text-muted-foreground text-xs">
                  {new Date(m.scheduled_at).toLocaleString()}
                </p>
              ) : null}
              {m.notes ? <p className="text-muted-foreground mt-1 text-sm">{m.notes}</p> : null}
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(m.id)}>
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
