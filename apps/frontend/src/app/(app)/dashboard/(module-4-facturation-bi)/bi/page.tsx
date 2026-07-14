"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, FileClock, Percent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/modules/module-1-multitenant-admin/lib/auth-context";

interface Overview {
  monthlyRevenue: { month: string; amount: number }[];
  totalRevenue: number;
  conversionRate: number;
  wonCount: number;
  lostCount: number;
  outstandingAmount: number;
  pendingQuotesCount: number;
  pendingQuotesAmount: number;
}

export default function BiDashboardPage() {
  const { accessToken } = useAuth();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    apiFetch<Overview>("/reporting/overview", { accessToken })
      .then(setOverview)
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  if (isLoading || !overview) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const maxRevenue = Math.max(...overview.monthlyRevenue.map((m) => m.amount), 1);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tableau de bord — Business Intelligence"
        description="Chiffre d'affaires, taux de conversion et encours, à partir de tes vraies données."
        back={
          <Link
            href="/dashboard"
            className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour au dashboard
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-start gap-4 py-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                CA cumulé (factures payées)
              </div>
              <div className="mt-0.5 text-2xl font-bold tabular-nums">
                {overview.totalRevenue.toLocaleString("fr-FR")} €
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-start gap-4 py-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ai/15 text-ai-foreground dark:text-ai">
              <FileClock className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Encours (factures non payées)
              </div>
              <div className="mt-0.5 text-2xl font-bold tabular-nums">
                {overview.outstandingAmount.toLocaleString("fr-FR")} €
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                + {overview.pendingQuotesCount} devis en attente (≈{" "}
                {overview.pendingQuotesAmount.toLocaleString("fr-FR")} €)
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 shadow-sm">
          <CardContent className="flex items-start gap-4 py-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
              <Percent className="h-5 w-5" />
            </span>
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Taux de conversion
              </div>
              <div className="mt-0.5 text-2xl font-bold tabular-nums">
                {overview.conversionRate}%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="py-5">
            <h2 className="mb-5 text-sm font-semibold">Chiffre d&apos;affaires mensuel</h2>
            <div className="flex h-40 items-end gap-3">
              {overview.monthlyRevenue.map((m, i) => {
                const isLast = i === overview.monthlyRevenue.length - 1;
                return (
                  <div
                    key={i}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                      {m.amount}
                    </span>
                    <div
                      className={`w-full rounded-t-md ${isLast ? "bg-primary" : "bg-primary/35"}`}
                      style={{ height: `${(m.amount / maxRevenue) * 100}%` }}
                    />
                    <span className="font-mono text-[10px] text-muted-foreground">{m.month}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="py-5">
            <h2 className="mb-5 text-sm font-semibold">Répartition des deals</h2>
            <div className="flex items-center gap-8">
              <div
                className="h-28 w-28 shrink-0 rounded-full"
                style={{
                  background: `conic-gradient(var(--primary) 0 ${overview.conversionRate}%, var(--muted) ${overview.conversionRate}% 100%)`,
                }}
              />
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                  Gagnés — <span className="font-semibold">{overview.wonCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-muted" />
                  Perdus — <span className="font-semibold">{overview.lostCount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
