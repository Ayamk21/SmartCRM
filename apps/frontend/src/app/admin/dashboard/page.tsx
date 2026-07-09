"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, LogOut, ShieldCheck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, ApiError } from "@/lib/api";
import { clearAdminToken, getAdminToken } from "@/lib/admin-auth";

interface AdminTenant {
  id: string;
  name: string;
  status: "PENDING" | "ACTIVE" | "REJECTED";
  plan: "FREE" | "PRO";
  createdAt: string;
  adminEmail: string | null;
}

const STATUS_STYLE: Record<AdminTenant["status"], string> = {
  PENDING: "bg-chart-2/15 text-chart-2 border-transparent",
  ACTIVE: "bg-success/15 text-success border-transparent",
  REJECTED: "bg-destructive/15 text-destructive border-transparent",
};

const STATUS_LABEL: Record<AdminTenant["status"], string> = {
  PENDING: "En attente",
  ACTIVE: "Actif",
  REJECTED: "Refusé",
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<AdminTenant[] | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      const data = await apiFetch<AdminTenant[]>("/admin/tenants", { accessToken: token });
      setTenants(data);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        clearAdminToken();
        router.replace("/login");
        return;
      }
      toast.error("Impossible de charger les demandes.");
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: "ACTIVE" | "REJECTED") {
    const token = getAdminToken();
    if (!token) return;
    setUpdatingId(id);
    try {
      await apiFetch(`/admin/tenants/${id}/status`, {
        method: "PATCH",
        accessToken: token,
        body: JSON.stringify({ status }),
      });
      toast.success(status === "ACTIVE" ? "Compte approuvé." : "Compte refusé.");
      await load();
    } catch {
      toast.error("Échec de la mise à jour.");
    } finally {
      setUpdatingId(null);
    }
  }

  function handleLogout() {
    clearAdminToken();
    router.push("/login");
  }

  const pending = tenants?.filter((t) => t.status === "PENDING") ?? [];
  const others = tenants?.filter((t) => t.status !== "PENDING") ?? [];

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Administration — Comptes</h1>
            <p className="text-xs text-muted-foreground">
              Validez ou refusez les demandes d&apos;inscription des agences.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={handleLogout}>
            <LogOut className="h-3.5 w-3.5" />
            Déconnexion
          </Button>
        </div>

        {tenants === null ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div>
              <h2 className="mb-3 text-sm font-semibold">
                En attente de validation ({pending.length})
              </h2>
              {pending.length === 0 ? (
                <Card className="border-dashed border-border/60">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    Aucune demande en attente.
                  </CardContent>
                </Card>
              ) : (
                <div className="flex flex-col gap-3">
                  {pending.map((tenant) => (
                    <Card key={tenant.id} className="border-border/60 shadow-sm">
                      <CardContent className="flex items-center gap-4 py-4">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">{tenant.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {tenant.adminEmail} ·{" "}
                            {new Date(tenant.createdAt).toLocaleDateString("fr-FR")}
                          </div>
                        </div>
                        <div className="ml-auto flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            disabled={updatingId === tenant.id}
                            className="bg-success text-white hover:bg-success/90"
                            onClick={() => updateStatus(tenant.id, "ACTIVE")}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updatingId === tenant.id}
                            className="border-destructive/40 text-destructive hover:bg-destructive/10"
                            onClick={() => updateStatus(tenant.id, "REJECTED")}
                          >
                            <X className="h-3.5 w-3.5" />
                            Refuser
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {others.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold">Historique</h2>
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="py-2">
                    {others.map((tenant) => (
                      <div
                        key={tenant.id}
                        className="flex items-center gap-3 border-b border-border/60 py-2.5 text-sm last:border-b-0"
                      >
                        <span className="font-medium">{tenant.name}</span>
                        <span className="text-xs text-muted-foreground">{tenant.adminEmail}</span>
                        <Badge className={`ml-auto text-[10px] ${STATUS_STYLE[tenant.status]}`}>
                          {STATUS_LABEL[tenant.status]}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
