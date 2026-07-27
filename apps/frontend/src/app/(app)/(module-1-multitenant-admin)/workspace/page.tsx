"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
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
import { PageHeader } from "@/components/layout/page-header";
import { apiFetch, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/modules/module-1-multitenant-admin/lib/auth-context";
import { SECURITY_QUESTIONS } from "@/modules/module-1-multitenant-admin/lib/security-questions";

interface Member {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "ADMIN" | "COLLABORATOR";
  createdAt: string;
}

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

type SectionId = "subscription" | "general" | "team" | "profile" | "security" | "danger";

export default function WorkspacePage() {
  const { user, accessToken, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState<SectionId>("subscription");

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

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profilePhone, setProfilePhone] = useState("");

  const [isSavingSecurity, setIsSavingSecurity] = useState(false);
  const [securityForm, setSecurityForm] = useState({
    question1: SECURITY_QUESTIONS[0],
    answer1: "",
    question2: SECURITY_QUESTIONS[1],
    answer2: "",
  });

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [members, setMembers] = useState<Member[]>([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "COLLABORATOR" as "ADMIN" | "COLLABORATOR",
  });
  const [invitedTempPassword, setInvitedTempPassword] = useState<{
    email: string;
    tempPassword: string;
  } | null>(null);
  const [removingMember, setRemovingMember] = useState<Member | null>(null);

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
    if (!accessToken) return;
    apiFetch<{ phone: string | null }>("/auth/profile", { accessToken })
      .then((data) => setProfilePhone(data.phone ?? ""))
      .catch(() => {});
  }, [accessToken]);

  function loadMembers() {
    if (!accessToken || !isAdmin) return;
    apiFetch<Member[]>("/workspace/members", { accessToken })
      .then(setMembers)
      .catch(() => toast.error("Impossible de charger l'équipe."));
  }

  useEffect(loadMembers, [accessToken, isAdmin]);

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

  async function handleProfileSubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsSavingProfile(true);
    try {
      await apiFetch("/auth/profile", {
        method: "PATCH",
        accessToken,
        body: JSON.stringify({ phone: profilePhone || undefined }),
      });
      toast.success("Numéro de téléphone enregistré.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de l'enregistrement.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleSecuritySubmit(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    if (securityForm.question1 === securityForm.question2) {
      toast.error("Choisis deux questions différentes.");
      return;
    }
    setIsSavingSecurity(true);
    try {
      await apiFetch("/auth/security-questions", {
        method: "POST",
        accessToken,
        body: JSON.stringify({
          questions: [
            { question: securityForm.question1, answer: securityForm.answer1 },
            { question: securityForm.question2, answer: securityForm.answer2 },
          ],
        }),
      });
      toast.success("Questions de sécurité enregistrées.");
      setSecurityForm((f) => ({ ...f, answer1: "", answer2: "" }));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de l'enregistrement.");
    } finally {
      setIsSavingSecurity(false);
    }
  }

  async function handleDeleteAccount(event: FormEvent) {
    event.preventDefault();
    if (!accessToken || !workspace) return;
    setIsDeleting(true);
    try {
      await apiFetch("/auth/account", {
        method: "DELETE",
        accessToken,
        body: JSON.stringify({ password: deletePassword }),
      });
      toast.success("Compte supprimé.");
      await logout();
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de la suppression.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    if (!accessToken) return;
    setIsInviting(true);
    try {
      const created = await apiFetch<Member & { tempPassword: string }>("/workspace/members", {
        method: "POST",
        accessToken,
        body: JSON.stringify({
          email: inviteForm.email,
          role: inviteForm.role,
          firstName: inviteForm.firstName || undefined,
          lastName: inviteForm.lastName || undefined,
        }),
      });
      setMembers((prev) => [...prev, created]);
      setInvitedTempPassword({ email: created.email, tempPassword: created.tempPassword });
      setInviteForm({ email: "", firstName: "", lastName: "", role: "COLLABORATOR" });
      setIsInviteOpen(false);
      toast.success("Membre invité — un email avec ses identifiants a été envoyé.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de l'invitation.");
    } finally {
      setIsInviting(false);
    }
  }

  async function handleRemoveMember() {
    if (!accessToken || !removingMember) return;
    try {
      await apiFetch(`/workspace/members/${removingMember.id}`, {
        method: "DELETE",
        accessToken,
      });
      setMembers((prev) => prev.filter((m) => m.id !== removingMember.id));
      toast.success("Membre retiré.");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec du retrait.");
    } finally {
      setRemovingMember(null);
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

  const sections: { id: SectionId; label: string; icon: LucideIcon }[] = [
    { id: "subscription", label: "Abonnement", icon: CreditCard },
    { id: "general", label: "Général", icon: Building2 },
    ...(isAdmin ? [{ id: "team" as const, label: "Équipe", icon: Users }] : []),
    { id: "profile", label: "Mon profil", icon: User },
    { id: "security", label: "Sécurité", icon: ShieldCheck },
    { id: "danger", label: "Zone de danger", icon: AlertTriangle },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Paramètres du workspace"
        description="Profil de votre agence, visible sur vos devis et factures."
      />

      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute top-52 -left-16 h-56 w-56 rounded-full bg-ai/15 blur-3xl" />
        </div>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:sticky lg:top-20 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-all",
                  isActive
                    ? section.id === "danger"
                      ? "bg-destructive/10 text-destructive shadow-sm shadow-destructive/10 ring-1 ring-destructive/15"
                      : "bg-gradient-to-r from-primary/10 to-ai/10 text-primary shadow-sm shadow-primary/10 ring-1 ring-primary/15"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
                    isActive
                      ? section.id === "danger"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-gradient-to-br from-primary to-ai text-primary-foreground"
                      : "text-muted-foreground/70",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {section.label}
              </button>
            );
          })}
        </nav>

        <div key={activeSection} className="min-w-0 flex-1 animate-in fade-in-0 slide-in-from-right-1 duration-200">
          {activeSection === "subscription" && (
            <Card className="border-border/60 shadow-sm">
              <div className="h-1 w-full bg-gradient-to-r from-ai via-ai/40 to-transparent" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Abonnement</CardTitle>
                  <Badge
                    className={
                      workspace.plan === "PRO"
                        ? "bg-gradient-to-r from-primary to-ai text-primary-foreground shadow-sm shadow-primary/30"
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
          )}

          {activeSection === "general" && (
            <Card className="border-border/60 shadow-sm">
              <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/40 to-transparent" />
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
                  <div className="grid gap-4 sm:grid-cols-2">
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
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
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
          )}

          {activeSection === "team" && isAdmin && (
            <Card className="border-border/60 shadow-sm">
              <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/40 to-transparent" />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Équipe</CardTitle>
                  <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                    <DialogTrigger render={<Button size="sm" />}>
                      <UserPlus className="h-3.5 w-3.5" />
                      Inviter
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Inviter un membre</DialogTitle>
                        <DialogDescription>
                          Un email avec un mot de passe temporaire lui sera envoyé.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleInvite} className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="inviteFirstName">Prénom</Label>
                            <Input
                              id="inviteFirstName"
                              value={inviteForm.firstName}
                              onChange={(e) =>
                                setInviteForm((f) => ({ ...f, firstName: e.target.value }))
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="inviteLastName">Nom</Label>
                            <Input
                              id="inviteLastName"
                              value={inviteForm.lastName}
                              onChange={(e) =>
                                setInviteForm((f) => ({ ...f, lastName: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="inviteEmail">Email</Label>
                          <Input
                            id="inviteEmail"
                            type="email"
                            required
                            value={inviteForm.email}
                            onChange={(e) =>
                              setInviteForm((f) => ({ ...f, email: e.target.value }))
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="inviteRole">Rôle</Label>
                          <Select
                            value={inviteForm.role}
                            onValueChange={(value) =>
                              value &&
                              setInviteForm((f) => ({
                                ...f,
                                role: value as "ADMIN" | "COLLABORATOR",
                              }))
                            }
                          >
                            <SelectTrigger id="inviteRole" className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="COLLABORATOR">Collaborateur</SelectItem>
                              <SelectItem value="ADMIN">Administrateur</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <DialogFooter>
                          <Button type="submit" disabled={isInviting}>
                            {isInviting ? "Envoi..." : "Envoyer l'invitation"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <CardDescription>Les membres de ton workspace et leurs rôles.</CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun autre membre pour l&apos;instant.
                  </p>
                ) : (
                  <div className="flex flex-col">
                    {members.map((member) => {
                      const displayName =
                        member.firstName || member.lastName
                          ? `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim()
                          : member.email;
                      const initials = displayName.slice(0, 2).toUpperCase();
                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-3 border-b border-border/60 py-2.5 text-sm last:border-b-0"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium">{displayName}</div>
                            <div className="truncate text-xs text-muted-foreground">
                              {member.email}
                            </div>
                          </div>
                          <Badge variant="secondary" className="ml-auto shrink-0">
                            {member.role === "ADMIN" ? "Administrateur" : "Collaborateur"}
                          </Badge>
                          {member.id !== user?.id && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setRemovingMember(member)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeSection === "profile" && (
            <Card className="border-border/60 shadow-sm">
              <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/40 to-transparent" />
              <CardHeader>
                <CardTitle className="text-base">Mon profil</CardTitle>
                <CardDescription>
                  Ton numéro de téléphone, utilisé pour recevoir un code de vérification par SMS.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="profilePhone">Téléphone</Label>
                    <Input
                      id="profilePhone"
                      type="tel"
                      placeholder="+216 12 345 678"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={isSavingProfile} className="mt-2 self-start">
                    {isSavingProfile ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeSection === "security" && (
            <Card className="border-border/60 shadow-sm">
              <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/40 to-transparent" />
              <CardHeader>
                <CardTitle className="text-base">Questions de sécurité</CardTitle>
                <CardDescription>
                  Utilisées pour récupérer ton compte en cas de mot de passe oublié.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSecuritySubmit} className="flex flex-col gap-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="question1">Question 1</Label>
                      <Select
                        value={securityForm.question1}
                        onValueChange={(value) =>
                          value && setSecurityForm((f) => ({ ...f, question1: value }))
                        }
                      >
                        <SelectTrigger id="question1" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SECURITY_QUESTIONS.map((q) => (
                            <SelectItem key={q} value={q}>
                              {q}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        required
                        placeholder="Ta réponse"
                        value={securityForm.answer1}
                        onChange={(e) => setSecurityForm((f) => ({ ...f, answer1: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="question2">Question 2</Label>
                      <Select
                        value={securityForm.question2}
                        onValueChange={(value) =>
                          value && setSecurityForm((f) => ({ ...f, question2: value }))
                        }
                      >
                        <SelectTrigger id="question2" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SECURITY_QUESTIONS.map((q) => (
                            <SelectItem key={q} value={q}>
                              {q}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        required
                        placeholder="Ta réponse"
                        value={securityForm.answer2}
                        onChange={(e) => setSecurityForm((f) => ({ ...f, answer2: e.target.value }))}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isSavingSecurity} className="mt-2 self-start">
                    {isSavingSecurity ? "Enregistrement..." : "Enregistrer mes questions"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {activeSection === "danger" && (
            <Card className="border-destructive/40 shadow-sm">
              <div className="h-1 w-full bg-gradient-to-r from-destructive via-destructive/40 to-transparent" />
              <CardHeader>
                <CardTitle className="text-base text-destructive">Zone de danger</CardTitle>
                <CardDescription>
                  {isAdmin
                    ? "Supprime définitivement ton compte et tout le workspace (contacts, deals, devis, factures...)."
                    : "Supprime définitivement ton compte personnel."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Dialog
                  open={isDeleteOpen}
                  onOpenChange={(open) => {
                    setIsDeleteOpen(open);
                    if (!open) {
                      setDeletePassword("");
                      setDeleteConfirmText("");
                    }
                  }}
                >
                  <DialogTrigger render={<Button variant="destructive" />}>
                    Supprimer mon compte
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Supprimer définitivement ton compte ?</DialogTitle>
                      <DialogDescription>
                        {isAdmin
                          ? `Cette action supprime ${workspace.name} et toutes ses données (contacts, deals, devis, factures). C'est irréversible.`
                          : "Cette action supprime ton compte personnel. C'est irréversible."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleDeleteAccount} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="deletePassword">Ton mot de passe</Label>
                        <Input
                          id="deletePassword"
                          type="password"
                          required
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="deleteConfirmText">
                          Tape{" "}
                          <span className="font-mono font-semibold">
                            {isAdmin ? workspace.name : user?.email}
                          </span>{" "}
                          pour confirmer
                        </Label>
                        <Input
                          id="deleteConfirmText"
                          required
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="submit"
                          variant="destructive"
                          disabled={
                            isDeleting ||
                            deleteConfirmText !== (isAdmin ? workspace.name : user?.email) ||
                            !deletePassword
                          }
                        >
                          {isDeleting ? "Suppression..." : "Supprimer définitivement"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
        </div>
      </div>

      <Dialog
        open={invitedTempPassword !== null}
        onOpenChange={(open) => !open && setInvitedTempPassword(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Membre invité</DialogTitle>
            <DialogDescription>
              Identifiants générés — utile si l&apos;email n&apos;a pas pu être livré.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase text-muted-foreground">Email</span>
              <span className="font-mono">{invitedTempPassword?.email}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Mot de passe temporaire
              </span>
              <span className="font-mono text-base font-semibold">
                {invitedTempPassword?.tempPassword}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setInvitedTempPassword(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={removingMember !== null}
        onOpenChange={(open) => !open && setRemovingMember(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              {removingMember?.email} n&apos;aura plus accès à ce workspace. Cette action est
              irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleRemoveMember}>
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
