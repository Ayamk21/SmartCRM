"use client";

import { useState, type FormEvent } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/page-header";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/modules/module-1-multitenant-admin/lib/auth-context";

interface QuoteLine {
  description: string;
  quantity: number;
  unitPrice: number;
}

export default function CopilotPage() {
  const { accessToken } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [lines, setLines] = useState<QuoteLine[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

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
    <div className="flex max-w-3xl flex-col gap-5">
      <PageHeader
        title="Copilot IA"
        description="Génération de devis par prompt : décris ta prestation, l'IA structure les lignes."
      />

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
            <div className="mt-4 flex items-center justify-end gap-3 border-t border-border/60 pt-3">
              <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Total
              </span>
              <span className="text-lg font-bold tabular-nums">
                {total.toLocaleString("fr-FR")} €
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
