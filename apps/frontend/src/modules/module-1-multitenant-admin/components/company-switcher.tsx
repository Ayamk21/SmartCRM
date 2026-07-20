"use client";

import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuth, type AuthUser } from "@/modules/module-1-multitenant-admin/lib/auth-context";

interface Company {
  tenantId: string;
  name: string;
  role: "ADMIN" | "COLLABORATOR";
  isOwner: boolean;
  status: string;
}

export function CompanySwitcher({ user }: { user: AuthUser }) {
  const { accessToken, switchCompany, createCompany } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");

  function loadCompanies() {
    if (!accessToken) return;
    apiFetch<Company[]>("/auth/companies", { accessToken })
      .then(setCompanies)
      .catch(() => {});
  }

  useEffect(loadCompanies, [accessToken]);

  const active = companies.find((c) => c.tenantId === user.tenantId);

  async function handleSwitch(tenantId: string) {
    if (tenantId === user.tenantId || isSwitching) return;
    setIsSwitching(true);
    try {
      await switchCompany(tenantId);
      window.location.assign("/dashboard");
    } catch {
      toast.error("Impossible de changer de société.");
      setIsSwitching(false);
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setIsCreating(true);
    try {
      await createCompany(newName, newCategory);
      toast.success("Société créée.");
      window.location.assign("/dashboard");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Échec de la création.");
      setIsCreating(false);
    }
  }

  return (
    <div className="px-3 pb-3">
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={isSwitching}
          className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border px-2.5 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent disabled:opacity-60"
        >
          <span className="min-w-0 flex-1 truncate font-medium">
            {active?.name ?? "Chargement..."}
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {companies.map((c) => (
            <DropdownMenuItem key={c.tenantId} onClick={() => handleSwitch(c.tenantId)}>
              <span className="min-w-0 flex-1 truncate">{c.name}</span>
              {c.tenantId === user.tenantId && <Check className="h-3.5 w-3.5 shrink-0" />}
            </DropdownMenuItem>
          ))}
          {user.role === "ADMIN" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Ajouter une société
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle société</DialogTitle>
            <DialogDescription>
              Crée un nouveau workspace dont tu seras propriétaire.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="companyName">Nom de l&apos;entreprise</Label>
              <Input
                id="companyName"
                required
                minLength={2}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="companyCategory">Secteur d&apos;activité</Label>
              <Input
                id="companyCategory"
                required
                minLength={2}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
