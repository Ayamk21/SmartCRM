"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthSplitLayout } from "@/modules/module-1-multitenant-admin/components/auth-split-layout";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/modules/module-1-multitenant-admin/lib/auth-context";

export default function SignupPage() {
  const { signup } = useAuth();
  const [tenantName, setTenantName] = useState("");
  const [category, setCategory] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await signup(tenantName, category, email);
      setIsDone(true);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Impossible de créer le compte.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isDone) {
    return (
      <AuthSplitLayout>
        <div className="w-full max-w-sm text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
            <Check className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold tracking-tight">Demande envoyée</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre demande a bien été créée pour <span className="font-medium">{tenantName}</span>.
            Un administrateur doit valider votre inscription — vous recevrez un email avec vos
            identifiants de connexion dès l&apos;approbation.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block font-medium text-primary underline underline-offset-4"
          >
            Retour à la connexion
          </Link>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout>
      <div className="w-full max-w-sm">
        <div className="mb-8 lg:hidden flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-ai text-sm font-bold text-primary-foreground shadow-sm">
            S
          </span>
          <span className="text-sm font-bold tracking-tight">Smart CRM Copilot</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">Créer votre espace</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Décris ton entreprise, un administrateur validera ta demande.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tenantName">Nom de l&apos;entreprise</Label>
            <Input
              id="tenantName"
              required
              minLength={2}
              className="h-10"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Secteur d&apos;activité</Label>
            <Input
              id="category"
              required
              minLength={2}
              placeholder="Ex : Agence web, freelance design..."
              className="h-10"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="h-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Aucun mot de passe à choisir maintenant : tu en recevras un temporaire par email une
            fois ta demande approuvée.
          </p>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 h-10 shadow-md shadow-primary/20"
          >
            {isSubmitting ? "Envoi..." : "Envoyer ma demande"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/login" className="font-medium text-primary underline underline-offset-4">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </AuthSplitLayout>
  );
}
