"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Lock, Save, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/modules/module-1-multitenant-admin/lib/auth-context";

interface QuoteLine {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string | null;
}

function QuoteGeneratorTool() {
  const { accessToken } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isSaveOpen, setIsSaveOpen] = useState(false);
  const [saveContactId, setSaveContactId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

  useEffect(() => {
    if (!accessToken) return;
    apiFetch<Contact[]>("/contacts", { accessToken }).catch(() => []).then((data) => {
      if (data) setContacts(data);
    });
  }, [accessToken]);

  async function handleSaveAsQuote(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !saveContactId) return;
    setIsSaving(true);
    try {
      await apiFetch("/quotes", {
        method: "POST",
        accessToken,
        body: JSON.stringify({
          contactId: saveContactId,
          lines: lines.map((line) => ({
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
          })),
        }),
      });
      toast.success("Devis enregistré — retrouve-le dans Devis & Factures.");
      setIsSaveOpen(false);
      setSaveContactId(null);
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Échec de l'enregistrement du devis.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerate(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !prompt.trim()) return;
    setIsGenerating(true);
    try {
      const generated = await apiFetch<QuoteLine[]>("/copilot/quote-generator", {
        method: "POST",
        accessToken,
        body: JSON.stringify({ prompt }),
      });
      setLines(generated);
      if (generated.length === 0) {
        toast.info("Aucune ligne détectée, essaie de reformuler ta demande.");
      }
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Échec de la génération du devis.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function updateLine(index: number, patch: Partial<QuoteLine>) {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="border-border/60 shadow-sm">
        <CardContent className="py-4">
          <form onSubmit={handleGenerate} className="flex flex-col gap-3">
            <Label htmlFor="prompt">Décris ta prestation</Label>
            <Textarea
              id="prompt"
              placeholder="Ex : Un site vitrine avec 5 pages à 300€, plus 2h de formation à 50€/h"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-24"
              required
            />
            <Button
              type="submit"
              disabled={isGenerating}
              className="self-end bg-ai text-ai-foreground hover:bg-ai/90"
            >
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Génération..." : "Générer le devis"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {lines.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="py-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Lignes du devis
            </h2>
            <div className="flex flex-col gap-2.5">
              {lines.map((line, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={line.description}
                    onChange={(e) => updateLine(i, { description: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={line.quantity}
                    onChange={(e) => updateLine(i, { quantity: Number(e.target.value) })}
                    className="w-20"
                  />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(i, { unitPrice: Number(e.target.value) })}
                    className="w-28"
                  />
                  <span className="w-24 shrink-0 text-right font-mono text-sm text-muted-foreground">
                    {(line.quantity * line.unitPrice).toLocaleString("fr-FR")} €
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeLine(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/60 pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsSaveOpen(true)}>
                <Save className="h-3.5 w-3.5" />
                Enregistrer comme devis
              </Button>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Total
                </span>
                <span className="text-lg font-bold tabular-nums">
                  {total.toLocaleString("fr-FR")} €
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={isSaveOpen} onOpenChange={setIsSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer comme devis</DialogTitle>
            <DialogDescription>
              Choisis le contact auquel rattacher ce devis.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAsQuote} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="saveContact">Contact</Label>
              <Select value={saveContactId} onValueChange={setSaveContactId}>
                <SelectTrigger id="saveContact" className="w-full">
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
            <DialogFooter>
              <Button type="submit" disabled={isSaving || !saveContactId}>
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConversationSummaryTool() {
  const { accessToken } = useAuth();
  const [text, setText] = useState("");
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [isSummarizing, setIsSummarizing] = useState(false);

  async function handleSummarize(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || text.trim().length < 20) {
      toast.info("Colle au moins quelques phrases d'échange à résumer.");
      return;
    }
    setIsSummarizing(true);
    try {
      const result = await apiFetch<{ paragraphs: string[] }>("/copilot/conversation-summary", {
        method: "POST",
        accessToken,
        body: JSON.stringify({ text }),
      });
      setParagraphs(result.paragraphs);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec du résumé.");
    } finally {
      setIsSummarizing(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="border-border/60 shadow-sm">
        <CardContent className="py-4">
          <form onSubmit={handleSummarize} className="flex flex-col gap-3">
            <Label htmlFor="conversation">Colle des emails ou un compte-rendu de réunion</Label>
            <Textarea
              id="conversation"
              placeholder="Colle ici le flux d'échanges (emails, notes de réunion...) à résumer"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-40"
              required
            />
            <Button
              type="submit"
              disabled={isSummarizing}
              className="self-end bg-ai text-ai-foreground hover:bg-ai/90"
            >
              <Sparkles className="h-4 w-4" />
              {isSummarizing ? "Résumé..." : "Résumer en 3 paragraphes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {paragraphs.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col gap-3 py-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Résumé
            </h2>
            {paragraphs.map((paragraph, i) => (
              <p key={i} className="text-sm leading-relaxed">
                {paragraph}
              </p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CopilotPage() {
  const { accessToken } = useAuth();
  const [plan, setPlan] = useState<"FREE" | "PRO" | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    apiFetch<{ plan: "FREE" | "PRO" }>("/workspace", { accessToken })
      .then((data) => setPlan(data.plan))
      .catch(() => toast.error("Impossible de vérifier ton abonnement."))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <PageHeader
        title="Copilot IA"
        description="Tes outils d'assistant intelligent pour gagner du temps au quotidien."
      />

      {isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : plan !== "PRO" ? (
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ai/15 text-ai">
              <Lock className="h-6 w-6" />
            </span>
            <h2 className="text-base font-semibold">Fonctionnalité réservée au plan Pro</h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Le Copilot IA (génération de devis, relances, résumés) est disponible uniquement
              pour les workspaces Pro. Passe en Pro pour y accéder.
            </p>
            <Button
              render={<Link href="/workspace" />}
              nativeButton={false}
              className="mt-2 bg-ai text-ai-foreground hover:bg-ai/90"
            >
              Passer en Pro
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="devis">
          <TabsList>
            <TabsTrigger value="devis">Génération de devis</TabsTrigger>
            <TabsTrigger value="resume">Résumé de conversation</TabsTrigger>
          </TabsList>
          <TabsContent value="devis" className="mt-4">
            <QuoteGeneratorTool />
          </TabsContent>
          <TabsContent value="resume" className="mt-4">
            <ConversationSummaryTool />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
