"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { MoreVertical, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/modules/module-1-multitenant-admin/lib/auth-context";
import {
  ContactFormFields,
  EMPTY_CONTACT_FORM,
  type ContactFormValues,
} from "@/modules/module-2-crm-pipeline/components/contact-form-fields";

interface Contact {
  id: string;
  type: "LEAD" | "CLIENT";
  firstName: string;
  lastName: string | null;
  company: string | null;
  title: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

const AVATAR_TONES = [
  "bg-primary/10 text-primary",
  "bg-ai/15 text-ai-foreground dark:text-ai",
  "bg-chart-3/15 text-chart-3",
  "bg-success/15 text-success",
];

function toFormValues(contact: Contact): ContactFormValues {
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

function toPayload(form: ContactFormValues) {
  return {
    type: form.type,
    firstName: form.firstName,
    lastName: form.lastName || undefined,
    company: form.company || undefined,
    title: form.title || undefined,
    email: form.email || undefined,
    phone: form.phone || undefined,
    notes: form.notes || undefined,
  };
}

export default function ContactsPage() {
  const { accessToken } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<ContactFormValues>(EMPTY_CONTACT_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editForm, setEditForm] = useState<ContactFormValues>(EMPTY_CONTACT_FORM);

  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    apiFetch<Contact[]>("/contacts", { accessToken })
      .then(setContacts)
      .catch(() => toast.error("Impossible de charger les contacts."))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSaving(true);
    try {
      const created = await apiFetch<Contact>("/contacts", {
        method: "POST",
        accessToken,
        body: JSON.stringify(toPayload(createForm)),
      });
      setContacts((prev) => [created, ...prev]);
      setCreateForm(EMPTY_CONTACT_FORM);
      setIsCreateOpen(false);
      toast.success("Contact ajouté.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de la création.");
    } finally {
      setIsSaving(false);
    }
  }

  function openEdit(contact: Contact) {
    setEditingContact(contact);
    setEditForm(toFormValues(contact));
  }

  async function handleEdit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !editingContact) return;
    setIsSaving(true);
    try {
      const updated = await apiFetch<Contact>(`/contacts/${editingContact.id}`, {
        method: "PATCH",
        accessToken,
        body: JSON.stringify(toPayload(editForm)),
      });
      setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingContact(null);
      toast.success("Contact mis à jour.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de la mise à jour.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!accessToken || !deletingContact) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/contacts/${deletingContact.id}`, { method: "DELETE", accessToken });
      setContacts((prev) => prev.filter((c) => c.id !== deletingContact.id));
      toast.success("Contact supprimé.");
      setDeletingContact(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Contacts"
        description="Leads et clients de votre agence."
        action={
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="h-4 w-4" />
              Nouveau contact
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nouveau contact</DialogTitle>
                <DialogDescription>
                  Ajoutez un prospect (lead) ou un client à votre CRM.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <ContactFormFields
                  value={createForm}
                  onChange={(patch) => setCreateForm((f) => ({ ...f, ...patch }))}
                />
                <DialogFooter>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Ajout..." : "Ajouter"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun contact pour l&apos;instant — ajoutez votre premier lead ou client.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact, i) => (
            <Card
              key={contact.id}
              className="h-full border-border/60 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <CardContent className="flex items-center gap-3 py-4">
                <Link href={`/contacts/${contact.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarFallback
                      className={`text-sm font-semibold ${AVATAR_TONES[i % AVATAR_TONES.length]}`}
                    >
                      {contact.firstName[0]}
                      {contact.lastName?.[0] ?? ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {contact.firstName} {contact.lastName}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {contact.title ?? "—"} · {contact.company ?? "—"}
                    </div>
                  </div>
                </Link>
                <Badge variant="secondary" className="shrink-0">
                  {contact.type === "LEAD" ? "Lead" : "Client"}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEdit(contact)}>
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => setDeletingContact(contact)}
                    >
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={editingContact !== null}
        onOpenChange={(open) => !open && setEditingContact(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le contact</DialogTitle>
            <DialogDescription>Mettez à jour les informations de ce contact.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="flex flex-col gap-4">
            <ContactFormFields
              value={editForm}
              onChange={(patch) => setEditForm((f) => ({ ...f, ...patch }))}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deletingContact !== null}
        onOpenChange={(open) => !open && setDeletingContact(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce contact ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingContact &&
                `${deletingContact.firstName} ${deletingContact.lastName ?? ""}`.trim()}{" "}
              sera définitivement supprimé, ainsi que ses opportunités et son historique
              d&apos;activité. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={handleDelete}
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
