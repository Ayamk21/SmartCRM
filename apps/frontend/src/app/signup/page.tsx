"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [tenantName, setTenantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await signup(tenantName, email, password);
      router.push("/dashboard");
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "Impossible de créer le compte.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
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
          Un compte, un workspace, gratuit pour commencer.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tenantName">Nom de l&apos;agence / votre nom</Label>
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="h-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">8 caractères minimum.</p>
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 h-10 shadow-md shadow-primary/20"
          >
            {isSubmitting ? "Création..." : "Créer mon espace"}
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
