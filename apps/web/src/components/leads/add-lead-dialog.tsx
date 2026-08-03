"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createLeadAction } from "@/app/(app)/leads/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AddLeadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createLeadAction({
        company: String(form.get("company") || ""),
        website_url: String(form.get("website_url") || "") || null,
        name: String(form.get("name") || ""),
        email: String(form.get("email") || ""),
        phone: String(form.get("phone") || "") || null,
        message: String(form.get("message") || "") || null,
        source: "manual",
      });

      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
      router.refresh();
      if ("id" in result && result.id) {
        router.push(`/leads/${result.id}`);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adaugă lead</DialogTitle>
          <DialogDescription>Adaugă manual un lead nou în pipeline.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Nume brand</Label>
            <Input id="company" name="company" placeholder="Techromania" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website_url">URL brand</Label>
            <Input id="website_url" name="website_url" placeholder="https://example.ro" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nume contact</Label>
            <Input id="name" name="name" required placeholder="Mihai Ionescu" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email contact</Label>
            <Input id="email" name="email" type="email" required placeholder="email@firma.ro" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon contact</Label>
            <Input id="phone" name="phone" placeholder="+40..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mesaj / detalii</Label>
            <Textarea id="message" name="message" rows={3} />
          </div>

          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anulează
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Adaugă lead nou
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
