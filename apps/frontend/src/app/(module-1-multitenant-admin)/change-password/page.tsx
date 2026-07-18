"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthSplitLayout } from "@/modules/module-1-multitenant-admin/components/auth-split-layout";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth } from "@/modules/module-1-multitenant-admin/lib/auth-context";

const PASSWORD_POLICY_HINT =
  "Au moins 8 caractères, avec une majuscule, une minuscule et un chiffre.";

export default function ChangePasswordPage() {
  const { accessToken, isLoading, markPasswordChanged } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !accessToken) {
      router.replace("/login");
    }
  }, [isLoading, accessToken, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        accessToken,
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      markPasswordChanged();
      toast.success("Mot de passe mis à jour.");
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Échec de la mise à jour.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthSplitLayout>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-ai text-sm font-bold text-primary-foreground shadow-sm">
            S
          </span>
          <span className="text-sm font-bold tracking-tight">Smart CRM Copilot</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">Change ton mot de passe</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pour ta sécurité, tu dois changer ton mot de passe temporaire avant de continuer.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="currentPassword">Mot de passe temporaire</Label>
            <Input
              id="currentPassword"
              type="password"
              required
              className="h-10"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input
              id="newPassword"
              type="password"
              required
              className="h-10"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{PASSWORD_POLICY_HINT}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirme le mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              required
              className="h-10"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="mt-2 h-10">
            {isSubmitting ? "Mise à jour..." : "Changer le mot de passe"}
          </Button>
        </form>
      </div>
    </AuthSplitLayout>
  );
}
