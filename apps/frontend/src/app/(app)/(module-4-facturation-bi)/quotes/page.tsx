"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Download, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { apiFetch, apiFetchBlob, ApiError } from "@/lib/api";
import { useAuth } from "@/modules/module-1-multitenant-admin/lib/auth-context";

type QuoteStatus = "DRAFT" | "VALIDATED" | "CONVERTED";
type InvoiceStatus = "DRAFT" | "SENT" | "PAID";

interface Contact {
  id: string;
  firstName: string;
  lastName: string | null;
}

interface DocumentLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: string;
}

interface Quote {
  id: string;
  number: string;
  status: QuoteStatus;
  issueDate: string;
  validUntil: string | null;
  notes: string | null;
  contact: Contact;
  lines: DocumentLine[];
  invoice: { id: string } | null;
}

interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  issueDate: string;
  contact: Contact;
  lines: DocumentLine[];
}

const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  DRAFT: "Brouillon",
  VALIDATED: "Validé",
  CONVERTED: "Converti",
};

const QUOTE_STATUS_STYLE: Record<QuoteStatus, string> = {
  DRAFT: "bg-secondary text-secondary-foreground",
  VALIDATED: "bg-chart-2/15 text-chart-2",
  CONVERTED: "bg-success/15 text-success",
};

const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Brouillon",
  SENT: "Envoyée",
  PAID: "Payée",
};

const INVOICE_STATUS_STYLE: Record<InvoiceStatus, string> = {
  DRAFT: "bg-secondary text-secondary-foreground",
  SENT: "bg-chart-2/15 text-chart-2",
  PAID: "bg-success/15 text-success",
};

function lineTotal(line: { quantity: number; unitPrice: string | number }) {
  return line.quantity * Number(line.unitPrice);
}

function quoteTotal(lines: DocumentLine[]) {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0);
}

async function downloadDocument(
  path: string,
  filename: string,
  accessToken: string | null,
) {
  try {
    const blob = await apiFetchBlob(path, { accessToken });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  } catch {
    toast.error("Impossible de générer le PDF.");
  }
}

interface LineDraft {
  description: string;
  quantity: string;
  unitPrice: string;
}

const EMPTY_LINE: LineDraft = { description: "", quantity: "1", unitPrice: "" };

function QuoteLinesEditor({
  lines,
  onChange,
}: {
  lines: LineDraft[];
  onChange: (lines: LineDraft[]) => void;
}) {
  function updateLine(index: number, patch: Partial<LineDraft>) {
    onChange(lines.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }
  function addLine() {
    onChange([...lines, { ...EMPTY_LINE }]);
  }
  function removeLine(index: number) {
    onChange(lines.filter((_, i) => i !== index));
  }

  const total = lines.reduce(
    (sum, line) => sum + Number(line.quantity || 0) * Number(line.unitPrice || 0),
    0,
  );

  return (
    <div className="flex flex-col gap-2.5">
      <Label>Lignes</Label>
      {lines.map((line, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            placeholder="Description"
            value={line.description}
            onChange={(e) => updateLine(i, { description: e.target.value })}
            className="flex-1"
            required
          />
          <Input
            type="number"
            min="0"
            step="1"
            value={line.quantity}
            onChange={(e) => updateLine(i, { quantity: e.target.value })}
            className="w-16"
            required
          />
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="Prix"
            value={line.unitPrice}
            onChange={(e) => updateLine(i, { unitPrice: e.target.value })}
            className="w-24"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => removeLine(i)}
            disabled={lines.length === 1}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={addLine}>
        <Plus className="h-3.5 w-3.5" />
        Ajouter une ligne
      </Button>
      <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-2 text-sm">
        <span className="font-medium text-muted-foreground">Total</span>
        <span className="font-mono font-semibold">{total.toLocaleString("fr-FR")} €</span>
      </div>
    </div>
  );
}

function QuotesTab({ contacts }: { contacts: Contact[] }) {
  const { accessToken } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [contactId, setContactId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([{ ...EMPTY_LINE }]);
  const [busyQuoteId, setBusyQuoteId] = useState<string | null>(null);

  function loadQuotes() {
    if (!accessToken) return;
    apiFetch<Quote[]>("/quotes", { accessToken })
      .then(setQuotes)
      .catch(() => toast.error("Impossible de charger les devis."))
      .finally(() => setIsLoading(false));
  }

  useEffect(loadQuotes, [accessToken]);

  function resetForm() {
    setContactId(null);
    setNotes("");
    setValidUntil("");
    setLines([{ ...EMPTY_LINE }]);
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !contactId) return;
    setIsSaving(true);
    try {
      await apiFetch<Quote>("/quotes", {
        method: "POST",
        accessToken,
        body: JSON.stringify({
          contactId,
          notes: notes || undefined,
          validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
          lines: lines.map((line) => ({
            description: line.description,
            quantity: Number(line.quantity),
            unitPrice: Number(line.unitPrice),
          })),
        }),
      });
      toast.success("Devis créé.");
      setIsDialogOpen(false);
      resetForm();
      loadQuotes();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de la création du devis.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleValidate(quote: Quote) {
    if (!accessToken) return;
    setBusyQuoteId(quote.id);
    try {
      await apiFetch(`/quotes/${quote.id}/validate`, { method: "POST", accessToken });
      toast.success("Devis validé.");
      loadQuotes();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de la validation.");
    } finally {
      setBusyQuoteId(null);
    }
  }

  async function handleConvert(quote: Quote) {
    if (!accessToken) return;
    setBusyQuoteId(quote.id);
    try {
      await apiFetch(`/quotes/${quote.id}/convert`, { method: "POST", accessToken });
      toast.success("Devis converti en facture.");
      loadQuotes();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de la conversion.");
    } finally {
      setBusyQuoteId(null);
    }
  }

  async function handleDelete(quote: Quote) {
    if (!accessToken) return;
    if (!window.confirm(`Supprimer le devis ${quote.number} ?`)) return;
    setBusyQuoteId(quote.id);
    try {
      await apiFetch(`/quotes/${quote.id}`, { method: "DELETE", accessToken });
      toast.success("Devis supprimé.");
      loadQuotes();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de la suppression.");
    } finally {
      setBusyQuoteId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogTrigger render={<Button className="self-start" />}>
          <Plus className="h-4 w-4" />
          Nouveau devis
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau devis</DialogTitle>
            <DialogDescription>
              Choisis un contact et détaille les lignes de la prestation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="contact">Contact</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger id="contact" className="w-full">
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
            </div>
            <QuoteLinesEditor lines={lines} onChange={setLines} />
            <div className="flex flex-col gap-2">
              <Label htmlFor="validUntil">Valable jusqu&apos;au (optionnel)</Label>
              <Input
                id="validUntil"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="notes">Notes (optionnel)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isSaving || !contactId}>
                {isSaving ? "Création..." : "Créer le devis"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun devis pour l&apos;instant.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {quotes.map((quote) => (
            <Card key={quote.id} className="border-border/60 shadow-sm">
              <CardContent className="flex flex-col gap-3 py-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-semibold">{quote.number}</span>
                  <Badge className={QUOTE_STATUS_STYLE[quote.status]}>
                    {QUOTE_STATUS_LABEL[quote.status]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {quote.contact.firstName} {quote.contact.lastName}
                  </span>
                  <span className="ml-auto font-mono text-sm font-semibold">
                    {quoteTotal(quote.lines).toLocaleString("fr-FR")} €
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadDocument(`/quotes/${quote.id}/pdf`, `${quote.number}.pdf`, accessToken)
                    }
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </Button>
                  {quote.status === "DRAFT" && (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        disabled={busyQuoteId === quote.id}
                        onClick={() => handleValidate(quote)}
                      >
                        Valider
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={busyQuoteId === quote.id}
                        onClick={() => handleDelete(quote)}
                      >
                        Supprimer
                      </Button>
                    </>
                  )}
                  {quote.status === "VALIDATED" && (
                    <Button
                      type="button"
                      size="sm"
                      className="bg-ai text-ai-foreground hover:bg-ai/90"
                      disabled={busyQuoteId === quote.id}
                      onClick={() => handleConvert(quote)}
                    >
                      Convertir en facture
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function InvoicesTab() {
  const { accessToken } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyInvoiceId, setBusyInvoiceId] = useState<string | null>(null);

  function loadInvoices() {
    if (!accessToken) return;
    apiFetch<Invoice[]>("/invoices", { accessToken })
      .then(setInvoices)
      .catch(() => toast.error("Impossible de charger les factures."))
      .finally(() => setIsLoading(false));
  }

  useEffect(loadInvoices, [accessToken]);

  async function handleStatusChange(invoice: Invoice, status: InvoiceStatus) {
    if (!accessToken) return;
    setBusyInvoiceId(invoice.id);
    try {
      await apiFetch(`/invoices/${invoice.id}/status`, {
        method: "PATCH",
        accessToken,
        body: JSON.stringify({ status }),
      });
      setInvoices((prev) => prev.map((inv) => (inv.id === invoice.id ? { ...inv, status } : inv)));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de la mise à jour.");
    } finally {
      setBusyInvoiceId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune facture pour l&apos;instant — convertis un devis validé pour en créer une.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {invoices.map((invoice) => (
        <Card key={invoice.id} className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-semibold">{invoice.number}</span>
              <Badge className={INVOICE_STATUS_STYLE[invoice.status]}>
                {INVOICE_STATUS_LABEL[invoice.status]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {invoice.contact.firstName} {invoice.contact.lastName}
              </span>
              <span className="ml-auto font-mono text-sm font-semibold">
                {quoteTotal(invoice.lines).toLocaleString("fr-FR")} €
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadDocument(`/invoices/${invoice.id}/pdf`, `${invoice.number}.pdf`, accessToken)
                }
              >
                <Download className="h-3.5 w-3.5" />
                PDF
              </Button>
              <Select
                value={invoice.status}
                onValueChange={(value) =>
                  value && handleStatusChange(invoice, value as InvoiceStatus)
                }
              >
                <SelectTrigger className="w-36" disabled={busyInvoiceId === invoice.id}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Brouillon</SelectItem>
                  <SelectItem value="SENT">Envoyée</SelectItem>
                  <SelectItem value="PAID">Payée</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function QuotesInvoicesPage() {
  const { accessToken } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (!accessToken) return;
    apiFetch<Contact[]>("/contacts", { accessToken }).catch(() => []).then((data) => {
      if (data) setContacts(data);
    });
  }, [accessToken]);

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <PageHeader
        title="Devis & Factures"
        description="Édite tes devis, valide-les, puis convertis-les en factures."
      />

      <Tabs defaultValue="devis">
        <TabsList>
          <TabsTrigger value="devis">Devis</TabsTrigger>
          <TabsTrigger value="factures">Factures</TabsTrigger>
        </TabsList>
        <TabsContent value="devis" className="mt-4">
          <QuotesTab contacts={contacts} />
        </TabsContent>
        <TabsContent value="factures" className="mt-4">
          <InvoicesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
