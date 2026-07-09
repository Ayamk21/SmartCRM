"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, TrendingUp, Percent, Users2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/modules/module-1-multitenant-admin/lib/auth-context";
import { MOCK_ACTIVITIES, MOCK_CONTACTS, MOCK_DEALS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function StatTile({
  label,
  value,
  delta,
  deltaTone,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "up" | "down";
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="flex items-start gap-4 py-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-0.5 text-2xl font-bold tabular-nums">{value}</div>
          {delta && (
            <div
              className={cn(
                "mt-1 flex items-center gap-1 text-xs font-medium",
                deltaTone === "up" && "text-success",
                deltaTone === "down" && "text-destructive",
              )}
            >
              {deltaTone === "up" ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" />
              )}
              {delta}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const won = MOCK_DEALS.filter((d) => d.status === "GAGNE");
  const totalWon = won.reduce((sum, d) => sum + d.amount, 0);
  const lost = MOCK_DEALS.filter((d) => d.status === "PERDU").length;
  const conversionRate = Math.round((won.length / (won.length + lost)) * 100);
  const newProspects = MOCK_DEALS.filter((d) => d.status === "PROSPECT").length;

  const contactsByid = Object.fromEntries(MOCK_CONTACTS.map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Bonjour ${user?.email?.split("@")[0]} 👋`}
        description="Voici un aperçu de l'activité de votre agence."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          label="CA (deals gagnés)"
          value={`${totalWon.toLocaleString("fr-FR")} €`}
          delta="+12% vs mois dernier"
          deltaTone="up"
          icon={TrendingUp}
        />
        <StatTile
          label="Taux de conversion"
          value={`${conversionRate}%`}
          delta="-3 pts"
          deltaTone="down"
          icon={Percent}
        />
        <StatTile
          label="Nouveaux prospects"
          value={String(newProspects)}
          delta="+4"
          deltaTone="up"
          icon={Users2}
        />
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="py-5">
          <h2 className="mb-4 text-sm font-semibold">Activité récente</h2>
          <div className="flex flex-col">
            {MOCK_ACTIVITIES.map((activity) => {
              const contact = contactsByid[activity.contactId];
              return (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 border-b border-border/60 py-3 text-sm last:border-b-0"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                      {contact?.firstName[0]}
                      {contact?.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <span className="font-medium">
                      {contact?.firstName} {contact?.lastName}
                    </span>{" "}
                    <span className="text-muted-foreground">{activity.label}</span>
                  </div>
                  <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
                    {activity.date}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Voir le{" "}
        <Link href="/dashboard/bi" className="font-medium text-primary underline underline-offset-4">
          tableau de bord détaillé (BI)
        </Link>
        , le{" "}
        <Link href="/pipeline" className="font-medium text-primary underline underline-offset-4">
          pipeline commercial
        </Link>{" "}
        ou les{" "}
        <Link href="/contacts" className="font-medium text-primary underline underline-offset-4">
          contacts
        </Link>
        .
      </p>
    </div>
  );
}
