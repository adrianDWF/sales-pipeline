"use client";

import type { LeadLegal } from "@sales-pipeline/shared";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addLeadLegalAction, deleteLeadLegalAction } from "@/app/(app)/leads/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function LeadLegalPanel({ leadId, legalItems }: { leadId: string; legalItems: LeadLegal[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  function add() {
    if (!title.trim()) return;
    startTransition(async () => {
      await addLeadLegalAction(leadId, { title, notes: notes || null });
      setTitle("");
      setNotes("");
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteLeadLegalAction(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Input placeholder="Titlu document / contract" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea placeholder="Note" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      <Button type="button" size="sm" disabled={isPending} onClick={add}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Adaugă înregistrare legală
      </Button>
      <ul className="space-y-2">
        {legalItems.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-2 rounded-lg border p-3">
            <div>
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-muted-foreground text-xs">{item.status}</p>
              {item.notes ? <p className="text-muted-foreground mt-1 text-sm">{item.notes}</p> : null}
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(item.id)}>
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
