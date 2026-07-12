"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Sparkles, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/modules/module-1-multitenant-admin/lib/auth-context";
import {
  ContactFormFields,
  type ContactFormValues,
} from "@/modules/module-2-crm-pipeline/components/contact-form-fields";
import { cn } from "@/lib/utils";

type DealStatus = "PROSPECT" | "QUALIFICATION" | "PROPOSITION" | "GAGNE" | "PERDU";
type ActivityType = "CALL" | "EMAIL" | "NOTE" | "STATUS_CHANGE";

interface Deal {
  id: string;
  title: string;
  amount: string;
  status: DealStatus;
}

interface Activity {
  id: string;
  type: ActivityType;
  content: string;
  createdAt: string;
}

interface ContactDetail {
  id: string;
  type: "LEAD" | "CLIENT";
  firstName: string;
  lastName: string | null;
  company: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  deals: Deal[];
  activities: Activity[];
}

function toFormValues(contact: ContactDetail): ContactFormValues {
  return {
    type: contact.type,
    firstName: contact.firstName,
    lastName: contact.lastName ?? "",
    company: contact.company ?? "",
    title: contact.title ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    notes: contact.notes ?? "",
  };
}

const ACTIVITY_TYPE_LABEL: Record<ActivityType, string> = {
  CALL: "Appel",
  EMAIL: "Email",
  NOTE: "Note",
  STATUS_CHANGE: "Changement de statut",
};

const STATUS_STYLE: Record<DealStatus, string> = {
  PROSPECT: "bg-chart-3/15 text-chart-3 border-transparent",
  QUALIFICATION: "bg-chart-2/15 text-chart-2 border-transparent",
  PROPOSITION: "bg-primary/15 text-primary border-transparent",
  GAGNE: "bg-success/15 text-success border-transparent",
  PERDU: "bg-destructive/15 text-destructive border-transparent",
};

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<ContactFormValues | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [activityForm, setActivityForm] = useState<{ type: ActivityType; content: string }>({
    type: "NOTE",
    content: "",
  });
  const [isAddingActivity, setIsAddingActivity] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    apiFetch<ContactDetail>(`/contacts/${id}`, { accessToken })
      .then(setContact)
      .catch((error) => {
        if (error instanceof ApiError && error.status === 404) {
          setNotFound(true);
        } else {
          toast.error("Impossible de charger ce contact.");
        }
      })
      .finally(() => setIsLoading(false));
  }, [accessToken, id]);

  function openEdit() {
    if (!contact) return;
    setEditForm(toFormValues(contact));
    setIsEditOpen(true);
  }

  async function handleEdit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !contact || !editForm) return;
    setIsSaving(true);
    try {
      const updated = await apiFetch<ContactDetail>(`/contacts/${contact.id}`, {
        method: "PATCH",
        accessToken,
        body: JSON.stringify({
          type: editForm.type,
          firstName: editForm.firstName,
          lastName: editForm.lastName || undefined,
          company: editForm.company || undefined,
          title: editForm.title || undefined,
          email: editForm.email || undefined,
          phone: editForm.phone || undefined,
          notes: editForm.notes || undefined,
        }),
      });
      setContact(updated);
      setIsEditOpen(false);
      toast.success("Contact mis à jour.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de la mise à jour.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAddActivity(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !contact || !activityForm.content.trim()) return;
    setIsAddingActivity(true);
    try {
      const created = await apiFetch<Activity>(`/contacts/${contact.id}/activities`, {
        method: "POST",
        accessToken,
        body: JSON.stringify(activityForm),
      });
      setContact((c) => (c ? { ...c, activities: [created, ...c.activities] } : c));
      setActivityForm({ type: "NOTE", content: "" });
      toast.success("Activité ajoutée.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de l'ajout de l'activité.");
    } finally {
      setIsAddingActivity(false);
    }
  }

  async function handleDelete() {
    if (!accessToken || !contact) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/contacts/${contact.id}`, { method: "DELETE", accessToken });
      toast.success("Contact supprimé.");
      router.push("/contacts");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de la suppression.");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  if (notFound || !contact) {
    return <p className="text-sm text-muted-foreground">Contact introuvable.</p>;
  }

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <Link
        href="/contacts"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour aux contacts
      </Link>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex items-start gap-4 py-5">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {contact.firstName[0]}
              {contact.lastName?.[0] ?? ""}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-lg font-bold">
              {contact.firstName} {contact.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {contact.company ?? "—"} — {contact.title ?? "—"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {contact.email ?? "—"} · {contact.phone ?? "—"}
            </p>
          </div>
          <div className="ml-auto flex shrink-0 gap-2">
            <Button size="sm" className="bg-ai text-ai-foreground hover:bg-ai/90">
              <Sparkles className="h-3.5 w-3.5" />
              Relance IA
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="h-3.5 w-3.5" />
              Nouveau devis
            </Button>
            <Button variant="outline" size="sm" onClick={openEdit}>
              <Pencil className="h-3.5 w-3.5" />
              Modifier
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="infos">
        <TabsList>
          <TabsTrigger value="infos">Infos</TabsTrigger>
          <TabsTrigger value="activite">Activité</TabsTrigger>
          <TabsTrigger value="devis">Devis & Factures</TabsTrigger>
        </TabsList>

        <TabsContent value="infos" className="mt-4">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="py-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Opportunités
              </h2>
              {contact.deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune opportunité pour l&apos;instant.</p>
              ) : (
                <div className="flex flex-col">
                  {contact.deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center gap-3 border-b border-border/60 py-2.5 text-sm last:border-b-0"
                    >
                      <span>{deal.title}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {Number(deal.amount).toLocaleString("fr-FR")} €
                      </span>
                      <Badge className={cn("ml-auto text-[10px]", STATUS_STYLE[deal.status])}>
                        {deal.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activite" className="mt-4 flex flex-col gap-4">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="py-4">
              <form onSubmit={handleAddActivity} className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <div className="flex w-40 shrink-0 flex-col gap-2">
                    <Label htmlFor="activityType">Type</Label>
                    <Select
                      value={activityForm.type}
                      onValueChange={(v) =>
                        v && setActivityForm((f) => ({ ...f, type: v as ActivityType }))
                      }
                    >
                      <SelectTrigger id="activityType" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOTE">Note</SelectItem>
                        <SelectItem value="CALL">Appel</SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <Label htmlFor="activityContent">Note</Label>
                    <Textarea
                      id="activityContent"
                      required
                      placeholder="Ex : Appel de découverte, 25 min, intéressé par l'offre Pro"
                      value={activityForm.content}
                      onChange={(e) =>
                        setActivityForm((f) => ({ ...f, content: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <Button type="submit" size="sm" className="self-end" disabled={isAddingActivity}>
                  {isAddingActivity ? "Ajout..." : "Ajouter l'activité"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardContent className="py-4">
              {contact.activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune activité enregistrée.</p>
              ) : (
                <div className="flex flex-col">
                  {contact.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-3 border-b border-border/60 py-2.5 last:border-b-0"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <div className="min-w-0">
                        <span className="text-xs font-medium text-muted-foreground">
                          {ACTIVITY_TYPE_LABEL[activity.type]}
                        </span>
                        <p className="text-sm">{activity.content}</p>
                      </div>
                      <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devis" className="mt-4">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Le module Devis &amp; Factures arrive en Phase 5.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le contact</DialogTitle>
            <DialogDescription>Mettez à jour les informations de ce contact.</DialogDescription>
          </DialogHeader>
          {editForm && (
            <form onSubmit={handleEdit} className="flex flex-col gap-4">
              <ContactFormFields
                value={editForm}
                onChange={(patch) => setEditForm((f) => (f ? { ...f, ...patch } : f))}
              />
              <DialogFooter>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce contact ?</AlertDialogTitle>
            <AlertDialogDescription>
              {contact.firstName} {contact.lastName ?? ""} sera définitivement supprimé, ainsi
              que ses opportunités et son historique d&apos;activité. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={isDeleting} onClick={handleDelete}>
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
