"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
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
import { PageHeader } from "@/components/layout/page-header";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

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

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ name: "", currency: "", siret: "", logoUrl: "" });

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
        });
      })
      .catch(() => toast.error("Impossible de charger le workspace."))
      .finally(() => setIsLoading(false));
  }, [accessToken]);

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
    <div className="max-w-lg">
      <div className="mb-5">
        <PageHeader
          title="Paramètres du workspace"
          description="Profil de votre agence, visible sur vos devis et factures."
        />
      </div>
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Informations générales</CardTitle>
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
