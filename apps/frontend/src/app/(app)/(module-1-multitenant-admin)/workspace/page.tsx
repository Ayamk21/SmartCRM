"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/modules/module-1-multitenant-admin/lib/auth-context";

const PDF_TEMPLATES = [
  { value: "classique", label: "Classique" },
  { value: "moderne", label: "Moderne" },
  { value: "minimaliste", label: "Minimaliste" },
];

interface Workspace {
  id: string;
  name: string;
  logoUrl: string | null;
  currency: string;
  siret: string | null;
  pdfTemplate: string | null;
  plan: "FREE" | "PRO";
}

export default function WorkspacePage() {
  const { user, accessToken } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const searchParams = useSearchParams();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    currency: "",
    siret: "",
    logoUrl: "",
    pdfTemplate: "classique",
  });

  useEffect(() => {
    if (!accessToken) return;
    apiFetch<Workspace>("/workspace", { accessToken })
      .then((data) => {
        setWorkspace(data);
        setForm({
          name: data.name,
          currency: data.currency,
          siret: data.siret ?? "",
          logoUrl: data.logoUrl ?? "",
          pdfTemplate: data.pdfTemplate ?? "classique",
        });
      })
      .catch(() => toast.error("Impossible de charger le workspace."))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  useEffect(() => {
    const upgrade = searchParams.get("upgrade");
    if (upgrade === "success") {
      toast.success("Abonnement Pro activé — merci !");
    } else if (upgrade === "cancelled") {
      toast.info("Passage en Pro annulé.");
    }
  }, [searchParams]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSaving(true);
    try {
      const updated = await apiFetch<Workspace>("/workspace", {
        method: "PATCH",
        accessToken,
        body: JSON.stringify({
          name: form.name,
          currency: form.currency,
          siret: form.siret || undefined,
          logoUrl: form.logoUrl || undefined,
          pdfTemplate: form.pdfTemplate || undefined,
        }),
      });
      setWorkspace(updated);
      toast.success("Workspace mis à jour.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de la mise à jour.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpgrade() {
    if (!accessToken) return;
    setIsRedirecting(true);
    try {
      const { url } = await apiFetch<{ url: string }>("/workspace/subscription/checkout", {
        method: "POST",
        accessToken,
      });
      window.location.href = url;
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Impossible de démarrer le paiement.",
      );
      setIsRedirecting(false);
    }
  }

  async function handleManageBilling() {
    if (!accessToken) return;
    setIsRedirecting(true);
    try {
      const { url } = await apiFetch<{ url: string }>("/workspace/subscription/portal", {
        method: "POST",
        accessToken,
      });
      window.location.href = url;
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Impossible d'ouvrir la gestion d'abonnement.",
      );
      setIsRedirecting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-lg space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    );
  }

  if (!workspace) {
    return <p className="text-sm text-muted-foreground">Workspace introuvable.</p>;
  }

  return (
    <div className="max-w-lg space-y-5">
      <PageHeader
        title="Paramètres du workspace"
        description="Profil de votre agence, visible sur vos devis et factures."
      />

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Abonnement</CardTitle>
            <Badge
              className={
                workspace.plan === "PRO"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }
            >
              {workspace.plan}
            </Badge>
          </div>
          <CardDescription>
            {workspace.plan === "FREE"
              ? "Plan limité. Passez en Pro pour un usage illimité."
              : "Plan illimité, merci pour votre confiance."}
          </CardDescription>
        </CardHeader>
        {isAdmin && (
          <CardContent>
            {workspace.plan === "FREE" ? (
              <Button
                onClick={handleUpgrade}
                disabled={isRedirecting}
                className="bg-ai text-ai-foreground hover:bg-ai/90"
              >
                <Sparkles className="h-4 w-4" />
                {isRedirecting ? "Redirection..." : "Passer en Pro"}
              </Button>
            ) : (
              <Button variant="outline" onClick={handleManageBilling} disabled={isRedirecting}>
                {isRedirecting ? "Redirection..." : "Gérer l'abonnement"}
              </Button>
            )}
          </CardContent>
        )}
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Informations générales</CardTitle>
          {!isAdmin && (
            <CardDescription>
              Lecture seule — réservé aux administrateurs pour modifier.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nom de l&apos;agence</Label>
              <Input
                id="name"
                required
                disabled={!isAdmin}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="currency">Devise</Label>
              <Input
                id="currency"
                disabled={!isAdmin}
                value={form.currency}
                onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="siret">SIRET</Label>
              <Input
                id="siret"
                disabled={!isAdmin}
                value={form.siret}
                onChange={(e) => setForm((f) => ({ ...f, siret: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="logoUrl">URL du logo</Label>
              <Input
                id="logoUrl"
                type="url"
                disabled={!isAdmin}
                placeholder="https://..."
                value={form.logoUrl}
                onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="pdfTemplate">Modèle de template PDF</Label>
              <Select
                disabled={!isAdmin}
                value={form.pdfTemplate}
                onValueChange={(value) =>
                  value && setForm((f) => ({ ...f, pdfTemplate: value }))
                }
              >
                <SelectTrigger id="pdfTemplate" className="w-full">
                  <SelectValue placeholder="Choisir un modèle" />
                </SelectTrigger>
                <SelectContent>
                  {PDF_TEMPLATES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Utilisé pour vos devis et factures (moteur PDF en Phase 5).
              </p>
            </div>
            {isAdmin && (
              <Button type="submit" disabled={isSaving} className="mt-2 self-start">
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
