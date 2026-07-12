"use client";

import { useEffect, useState, type DragEvent, type FormEvent } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/modules/module-1-multitenant-admin/lib/auth-context";

type DealStatus = "PROSPECT" | "QUALIFICATION" | "PROPOSITION" | "GAGNE" | "PERDU";

interface Contact {
  id: string;
  firstName: string;
  lastName: string | null;
}

interface Deal {
  id: string;
  title: string;
  amount: string;
  status: DealStatus;
  contactId: string;
  contact: Contact;
}

const COLUMNS: { status: DealStatus; label: string; dot: string }[] = [
  { status: "PROSPECT", label: "Prospect", dot: "bg-chart-3" },
  { status: "QUALIFICATION", label: "Qualification", dot: "bg-chart-2" },
  { status: "PROPOSITION", label: "Proposition", dot: "bg-primary" },
  { status: "GAGNE", label: "Gagné", dot: "bg-success" },
  { status: "PERDU", label: "Perdu", dot: "bg-destructive" },
];

interface DealFormValues {
  contactId: string | null;
  title: string;
  amount: string;
}

const EMPTY_FORM: DealFormValues = { contactId: null, title: "", amount: "" };

export default function PipelinePage() {
  const { accessToken } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<DealStatus | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      apiFetch<Deal[]>("/deals", { accessToken }),
      apiFetch<Contact[]>("/contacts", { accessToken }),
    ])
      .then(([dealsData, contactsData]) => {
        setDeals(dealsData);
        setContacts(contactsData);
      })
      .catch(() => toast.error("Impossible de charger le pipeline."))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  const totalPipeline = deals
    .filter((d) => d.status !== "PERDU")
    .reduce((s, d) => s + Number(d.amount), 0);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !form.contactId) return;
    setIsSaving(true);
    try {
      const created = await apiFetch<Deal>("/deals", {
        method: "POST",
        accessToken,
        body: JSON.stringify({
          contactId: form.contactId,
          title: form.title,
          amount: Number(form.amount),
        }),
      });
      setDeals((prev) => [created, ...prev]);
      setForm(EMPTY_FORM);
      setIsDialogOpen(false);
      toast.success("Opportunité créée.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de la création.");
    } finally {
      setIsSaving(false);
    }
  }

  async function moveDeal(dealId: string, status: DealStatus) {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.status === status || !accessToken) return;

    const previousStatus = deal.status;
    setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, status } : d)));

    try {
      await apiFetch<Deal>(`/deals/${dealId}`, {
        method: "PATCH",
        accessToken,
        body: JSON.stringify({ status }),
      });
    } catch (error) {
      setDeals((prev) => prev.map((d) => (d.id === dealId ? { ...d, status: previousStatus } : d)));
      toast.error(error instanceof ApiError ? error.message : "Échec du déplacement.");
    }
  }

  function handleDragStart(event: DragEvent<HTMLDivElement>, dealId: string) {
    setDraggingId(dealId);
    event.dataTransfer.setData("text/plain", dealId);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, status: DealStatus) {
    event.preventDefault();
    const dealId = event.dataTransfer.getData("text/plain");
    setDraggingId(null);
    setDragOverStatus(null);
    moveDeal(dealId, status);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Pipeline commercial" description="Chargement..." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {COLUMNS.map((col) => (
            <Skeleton key={col.status} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Pipeline commercial"
        description="Glissez une carte d'une colonne à l'autre pour changer son statut."
        action={
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Valeur totale
              </div>
              <div className="text-xl font-bold tabular-nums">
                {totalPipeline.toLocaleString("fr-FR")} €
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger render={<Button />}>
                <Plus className="h-4 w-4" />
                Nouvelle opportunité
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nouvelle opportunité</DialogTitle>
                  <DialogDescription>
                    Créez un deal lié à un contact existant.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contactId">Contact</Label>
                    <Select
                      value={form.contactId}
                      onValueChange={(v) => setForm((f) => ({ ...f, contactId: v }))}
                    >
                      <SelectTrigger id="contactId" className="w-full">
                        <SelectValue placeholder="Choisir un contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.firstName} {contact.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {contacts.length === 0 && (
                      <p className="text-xs text-destructive">
                        Aucun contact disponible — créez d&apos;abord un contact dans la page
                        Contacts.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="title">Titre</Label>
                    <Input
                      id="title"
                      required
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="amount">Montant (€)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSaving || !form.contactId}>
                      {isSaving ? "Création..." : "Créer"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-5">
        {COLUMNS.map((col) => {
          const columnDeals = deals.filter((d) => d.status === col.status);
          return (
            <div
              key={col.status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStatus(col.status);
              }}
              onDragLeave={() => setDragOverStatus((s) => (s === col.status ? null : s))}
              onDrop={(e) => handleDrop(e, col.status)}
              className={cn(
                "flex min-w-0 flex-col gap-2.5 rounded-xl p-1.5 transition-colors",
                dragOverStatus === col.status && "bg-muted/60",
              )}
            >
              <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className={cn("h-2 w-2 rounded-full", col.dot)} />
                {col.label}
                <span className="ml-auto font-mono font-normal text-muted-foreground/70">
                  {String(columnDeals.length).padStart(2, "0")}
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {columnDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal.id)}
                    onDragEnd={() => setDraggingId(null)}
                  >
                    <Link href={`/contacts/${deal.contactId}`}>
                      <Card
                        className={cn(
                          "cursor-grab gap-2 border-border/60 px-3.5 py-3.5 shadow-sm transition-all active:cursor-grabbing hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                          col.status === "PERDU" && "opacity-60",
                          draggingId === deal.id && "opacity-40",
                        )}
                      >
                        <div className="text-sm font-medium leading-snug">{deal.title}</div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-foreground/80">
                            {Number(deal.amount).toLocaleString("fr-FR")} €
                          </span>
                          <div className="ml-auto flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">
                              {deal.contact?.firstName}
                            </span>
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="bg-primary/10 text-[9px] text-primary">
                                {deal.contact?.firstName[0]}
                                {deal.contact?.lastName?.[0] ?? ""}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </div>
                ))}
                {columnDeals.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/60 py-6 text-center text-xs text-muted-foreground/50">
                    Aucune opportunité
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
