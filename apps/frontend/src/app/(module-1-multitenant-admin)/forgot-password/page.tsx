"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Mail, MessageSquare, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthSplitLayout } from "@/modules/module-1-multitenant-admin/components/auth-split-layout";
import { apiFetch, ApiError } from "@/lib/api";

const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const PASSWORD_POLICY_HINT =
  "Au moins 8 caractères, avec une majuscule, une minuscule et un chiffre.";

type Step = "email" | "method" | "questions" | "otp" | "password" | "done";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [otpChannel, setOtpChannel] = useState<"EMAIL" | "SMS">("EMAIL");
  const [otpCode, setOtpCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function handleEmailSubmit(event: FormEvent) {
    event.preventDefault();
    setStep("method");
  }

  async function handleChooseQuestions() {
    setIsSubmitting(true);
    try {
      const data = await apiFetch<{ questions: string[] }>(
        `/auth/security-questions/${encodeURIComponent(email)}`,
      );
      if (data.questions.length === 0) {
        toast.error("Aucune question de sécurité configurée pour ce compte.");
        return;
      }
      setQuestions(data.questions);
      setStep("questions");
    } catch {
      toast.error("Impossible de vérifier ce compte.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleChooseOtp(channel: "EMAIL" | "SMS") {
    setIsSubmitting(true);
    try {
      await apiFetch("/auth/recover/request-otp", {
        method: "POST",
        body: JSON.stringify({ email, channel }),
      });
      setOtpChannel(channel);
      setOtpCode("");
      setStep("otp");
      toast.success(
        channel === "EMAIL" ? "Code envoyé par email." : "Code envoyé par SMS.",
      );
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Impossible d'envoyer le code.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAnswersSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await apiFetch<{ resetToken: string }>(
        "/auth/recover/verify-security-answers",
        {
          method: "POST",
          body: JSON.stringify({
            email,
            answers: questions.map((question) => ({
              question,
              answer: answers[question] ?? "",
            })),
          }),
        },
      );
      setResetToken(data.resetToken);
      setStep("password");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Réponses incorrectes.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleOtpSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await apiFetch<{ resetToken: string }>("/auth/recover/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, code: otpCode }),
      });
      setResetToken(data.resetToken);
      setStep("password");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Code invalide ou expiré.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }
    if (!PASSWORD_POLICY_REGEX.test(newPassword)) {
      toast.error(PASSWORD_POLICY_HINT);
      return;
    }
    setIsSubmitting(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ resetToken, newPassword }),
      });
      setStep("done");
      toast.success("Mot de passe réinitialisé.");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Échec de la réinitialisation.",
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

        <h1 className="text-2xl font-bold tracking-tight">Mot de passe oublié</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {step === "email" && "Indique ton email pour commencer la récupération."}
          {step === "method" && "Choisis comment récupérer ton compte."}
          {step === "questions" && "Réponds à tes questions de sécurité."}
          {step === "otp" &&
            (otpChannel === "EMAIL"
              ? "Entre le code reçu par email."
              : "Entre le code reçu par SMS.")}
          {step === "password" && "Choisis un nouveau mot de passe."}
          {step === "done" && "C'est fait !"}
        </p>

        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                className="h-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="mt-2 h-10">
              Continuer
            </Button>
          </form>
        )}

        {step === "method" && (
          <div className="mt-8 flex flex-col gap-3">
            <Button
              variant="outline"
              className="h-11 justify-start"
              disabled={isSubmitting}
              onClick={handleChooseQuestions}
            >
              <ShieldQuestion className="h-4 w-4" />
              Questions de sécurité
            </Button>
            <Button
              variant="outline"
              className="h-11 justify-start"
              disabled={isSubmitting}
              onClick={() => handleChooseOtp("EMAIL")}
            >
              <Mail className="h-4 w-4" />
              Recevoir un code par email
            </Button>
            <Button
              variant="outline"
              className="h-11 justify-start"
              disabled={isSubmitting}
              onClick={() => handleChooseOtp("SMS")}
            >
              <MessageSquare className="h-4 w-4" />
              Recevoir un code par SMS
            </Button>
          </div>
        )}

        {step === "questions" && (
          <form onSubmit={handleAnswersSubmit} className="mt-8 flex flex-col gap-4">
            {questions.map((question) => (
              <div key={question} className="flex flex-col gap-2">
                <Label htmlFor={question}>{question}</Label>
                <Input
                  id={question}
                  required
                  className="h-10"
                  value={answers[question] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [question]: e.target.value }))
                  }
                />
              </div>
            ))}
            <Button type="submit" disabled={isSubmitting} className="mt-2 h-10">
              {isSubmitting ? "Vérification..." : "Valider mes réponses"}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="mt-8 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="otpCode">Code à 6 chiffres</Label>
              <Input
                id="otpCode"
                required
                maxLength={6}
                inputMode="numeric"
                className="h-10 text-center text-lg tracking-[0.5em]"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <Button type="submit" disabled={isSubmitting || otpCode.length !== 6} className="mt-2 h-10">
              {isSubmitting ? "Vérification..." : "Valider le code"}
            </Button>
          </form>
        )}

        {step === "password" && (
          <form onSubmit={handlePasswordSubmit} className="mt-8 flex flex-col gap-4">
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
              {isSubmitting ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
            </Button>
          </form>
        )}

        {step === "done" && (
          <div className="mt-8 flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Ton mot de passe a bien été changé, tu peux te connecter avec.
            </p>
            <Button className="h-10" onClick={() => router.push("/login")}>
              Aller à la connexion
            </Button>
          </div>
        )}

        {step !== "done" && (
          <>
            <p className="mt-6 text-center text-sm text-muted-foreground">
              <Link href="/login" className="font-medium text-primary underline underline-offset-4">
                Retour à la connexion
              </Link>
            </p>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Aucune de ces options ne fonctionne ? Contacte l&apos;administrateur de ton
              agence directement — lui seul peut réinitialiser ton accès manuellement.
            </p>
          </>
        )}
      </div>
    </AuthSplitLayout>
  );
}
