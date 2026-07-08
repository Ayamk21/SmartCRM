"use client";

import Link from "next/link";
import { ArrowLeft, Wallet, FileClock, Percent } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { MOCK_DEALS, MOCK_MONTHLY_REVENUE } from "@/lib/mock-data";

export default function BiDashboardPage() {
  const won = MOCK_DEALS.filter((d) => d.status === "GAGNE");
  const lost = MOCK_DEALS.filter((d) => d.status === "PERDU");
  const pending = MOCK_DEALS.filter((d) => d.status === "PROPOSITION");
  const totalWon = won.reduce((s, d) => s + d.amount, 0);
  const pendingAmount = pending.reduce((s, d) => s + d.amount, 0);
  const conversionRate = Math.round((won.length / (won.length + lost.length)) * 100);
  const maxRevenue = Math.max(...MOCK_MONTHLY_REVENUE.map((m) => m.value));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Tableau de bord — Business Intelligence"
        description="Données d'exemple — les agrégations réelles arrivent en Phase 5."
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
                CA cumulé (deals gagnés)
              </div>
              <div className="mt-0.5 text-2xl font-bold tabular-nums">
                {totalWon.toLocaleString("fr-FR")} €
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
                Devis en attente
              </div>
              <div className="mt-0.5 text-2xl font-bold tabular-nums">{pending.length}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                ≈ {pendingAmount.toLocaleString("fr-FR")} €
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
              <div className="mt-0.5 text-2xl font-bold tabular-nums">{conversionRate}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="py-5">
            <h2 className="mb-5 text-sm font-semibold">Chiffre d&apos;affaires mensuel</h2>
            <div className="flex h-40 items-end gap-3">
              {MOCK_MONTHLY_REVENUE.map((m, i) => {
                const isLast = i === MOCK_MONTHLY_REVENUE.length - 1;
                return (
                  <div
                    key={i}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                      {m.value}
                    </span>
                    <div
                      className={`w-full rounded-t-md ${isLast ? "bg-primary" : "bg-primary/35"}`}
                      style={{ height: `${(m.value / maxRevenue) * 100}%` }}
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
                  background: `conic-gradient(var(--primary) 0 ${conversionRate}%, var(--muted) ${conversionRate}% 100%)`,
                }}
              />
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                  Gagnés — <span className="font-semibold">{won.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm bg-muted" />
                  Perdus — <span className="font-semibold">{lost.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
