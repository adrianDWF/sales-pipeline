"use client";

import type { LeadNote } from "@sales-pipeline/shared";
import { format } from "date-fns";
import { Loader2, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  addLeadNoteAction,
  softDeleteLeadNoteAction,
  updateLeadNoteAction,
} from "@/app/(app)/leads/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

function formatNoteDate(value: string) {
  return format(new Date(value), "d MMM yyyy, HH:mm");
}

function authorLabel(note: LeadNote) {
  return note.author?.full_name?.trim() || note.author?.email || "Utilizator";
}

function authorInitials(note: LeadNote) {
  const source = authorLabel(note);
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function NoteCard({
  note,
  currentUserId,
  isSuperUser,
}: {
  note: LeadNote;
  currentUserId: string;
  isSuperUser: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(note.body);
  const canManage = isSuperUser || note.author_id === currentUserId;

  function saveEdit() {
    if (!draft.trim()) return;
    startTransition(async () => {
      const result = await updateLeadNoteAction(note.id, draft);
      if ("error" in result && result.error) return;
      setIsEditing(false);
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await softDeleteLeadNoteAction(note.id);
      router.refresh();
    });
  }

  return (
    <li className="bg-card rounded-xl border p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="text-xs">{authorInitials(note)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{authorLabel(note)}</p>
            <p className="text-muted-foreground text-xs">{formatNoteDate(note.created_at)}</p>
          </div>
        </div>
        {canManage ? (
          <div className="flex items-center gap-1">
            {!isEditing ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={isPending}
                onClick={() => setIsEditing(true)}
                aria-label="Editează nota"
              >
                <Pencil className="size-4" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={isPending}
              onClick={remove}
              aria-label="Șterge nota"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Anulează
            </Button>
            <Button type="button" size="sm" disabled={isPending} onClick={saveEdit}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Salvează
            </Button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-sm">{note.body}</p>
      )}
    </li>
  );
}

export function LeadNotesPanel({
  leadId,
  notes,
  currentUserId,
  isSuperUser,
}: {
  leadId: string;
  notes: LeadNote[];
  currentUserId: string;
  isSuperUser: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await addLeadNoteAction(leadId, body);
      if ("error" in result && result.error) return;
      setBody("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <p className="text-sm font-medium">Adaugă o nouă notiță</p>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Scrie notița aici..."
          rows={4}
        />
        <div className="flex justify-end">
          <Button type="button" disabled={isPending || !body.trim()} onClick={submit}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Adaugă
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold">Toate notițele</p>
        {notes.length > 0 ? (
          <ul className="space-y-3">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                currentUserId={currentUserId}
                isSuperUser={isSuperUser}
              />
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">Nicio notiță încă.</p>
        )}
      </div>
    </div>
  );
}
