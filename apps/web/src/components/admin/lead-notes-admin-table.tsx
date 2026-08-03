"use client";

import type { AdminLeadNote } from "@sales-pipeline/shared";
import { format } from "date-fns";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import {
  permanentDeleteLeadNoteAction,
  restoreLeadNoteAction,
} from "@/app/(app)/leads/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatNoteDate(value: string) {
  return format(new Date(value), "d MMM yyyy, HH:mm");
}

function authorLabel(note: AdminLeadNote) {
  return note.author?.full_name?.trim() || note.author?.email || "—";
}

function leadLabel(note: AdminLeadNote) {
  return note.lead?.company?.trim() || note.lead?.name || "Lead";
}

export function LeadNotesAdminTable({ notes }: { notes: AdminLeadNote[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function restore(noteId: string) {
    startTransition(async () => {
      await restoreLeadNoteAction(noteId);
      router.refresh();
    });
  }

  function removePermanently(noteId: string) {
    startTransition(async () => {
      await permanentDeleteLeadNoteAction(noteId);
      router.refresh();
    });
  }

  if (notes.length === 0) {
    return <p className="text-muted-foreground text-sm">Nicio notiță pentru filtrul selectat.</p>;
  }

  return (
    <div className="bg-card overflow-hidden rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Lead</TableHead>
            <TableHead>Autor</TableHead>
            <TableHead>Notiță</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Creată</TableHead>
            <TableHead className="text-right">Acțiuni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notes.map((note) => (
            <TableRow key={note.id}>
              <TableCell>
                <Link href={`/leads/${note.lead_id}`} className="font-medium hover:underline">
                  {leadLabel(note)}
                </Link>
              </TableCell>
              <TableCell>{authorLabel(note)}</TableCell>
              <TableCell className="max-w-md truncate">{note.body}</TableCell>
              <TableCell>
                {note.deleted_at ? (
                  <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                    Ștearsă
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
                    Activă
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {formatNoteDate(note.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {note.deleted_at ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => restore(note.id)}
                    >
                      {isPending ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                      Restaurează
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={() => removePermanently(note.id)}
                  >
                    {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                    Șterge definitiv
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
