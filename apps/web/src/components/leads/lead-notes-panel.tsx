"use client";

import type { LeadNote } from "@sales-pipeline/shared";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addLeadNoteAction } from "@/app/(app)/leads/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function LeadNotesPanel({ leadId, notes }: { leadId: string; notes: LeadNote[] }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!body.trim()) return;
    startTransition(async () => {
      await addLeadNoteAction(leadId, body);
      setBody("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Adaugă o notă..."
        rows={4}
      />
      <Button type="button" size="sm" disabled={isPending} onClick={submit}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Adaugă notă
      </Button>
      <ul className="space-y-3">
        {notes.map((note) => (
          <li key={note.id} className="bg-muted/40 rounded-lg border p-3 text-sm">
            <p className="whitespace-pre-wrap">{note.body}</p>
            <p className="text-muted-foreground mt-2 text-xs">
              {new Date(note.created_at).toLocaleString()}
            </p>
          </li>
        ))}
        {notes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nicio notă încă.</p>
        ) : null}
      </ul>
    </div>
  );
}
