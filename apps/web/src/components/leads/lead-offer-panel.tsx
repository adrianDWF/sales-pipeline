"use client";

import type { LeadOffer } from "@sales-pipeline/shared";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addLeadOfferAction, deleteLeadOfferAction } from "@/app/(app)/leads/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function LeadOfferPanel({ leadId, offers }: { leadId: string; offers: LeadOffer[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  function add() {
    if (!title.trim()) return;
    startTransition(async () => {
      await addLeadOfferAction(leadId, {
        title,
        amount: amount ? Number(amount) : null,
        notes: notes || null,
      });
      setTitle("");
      setAmount("");
      setNotes("");
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteLeadOfferAction(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Input placeholder="Titlu ofertă" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Input
        placeholder="Sumă"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <Textarea placeholder="Note" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      <Button type="button" size="sm" disabled={isPending} onClick={add}>
        {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
        Adaugă ofertă
      </Button>
      <ul className="space-y-2">
        {offers.map((o) => (
          <li key={o.id} className="flex items-start justify-between gap-2 rounded-lg border p-3">
            <div>
              <p className="font-medium text-sm">{o.title}</p>
              <p className="text-muted-foreground text-xs">
                {o.amount != null ? `${o.amount} ${o.currency}` : "—"} · {o.status}
              </p>
              {o.notes ? <p className="text-muted-foreground mt-1 text-sm">{o.notes}</p> : null}
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(o.id)}>
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
