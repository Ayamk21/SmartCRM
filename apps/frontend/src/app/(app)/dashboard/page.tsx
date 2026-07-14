"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp, Percent, Users2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { useAuth } from "@/modules/module-1-multitenant-admin/lib/auth-context";
import { apiFetch } from "@/lib/api";

type DealStatus = "PROSPECT" | "QUALIFICATION" | "PROPOSITION" | "GAGNE" | "PERDU";

interface Deal {
  id: string;
  status: DealStatus;
  amount: string;
}

interface RecentActivity {
  id: string;
  content: string;
  createdAt: string;
  contact: {
    firstName: string;
    lastName: string | null;
  };
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
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
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, accessToken } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      apiFetch<Deal[]>("/deals", { accessToken }),
      apiFetch<RecentActivity[]>("/activities/recent?limit=5", { accessToken }),
    ])
      .then(([dealsData, activitiesData]) => {
        setDeals(dealsData);
        setActivities(activitiesData);
      })
      .finally(() => setIsLoading(false));
  }, [accessToken]);

  const won = deals.filter((d) => d.status === "GAGNE");
  const lost = deals.filter((d) => d.status === "PERDU").length;
  const totalWon = won.reduce((sum, d) => sum + Number(d.amount), 0);
  const conversionRate =
    won.length + lost > 0 ? Math.round((won.length / (won.length + lost)) * 100) : 0;
  const newProspects = deals.filter((d) => d.status === "PROSPECT").length;

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
          icon={TrendingUp}
        />
        <StatTile label="Taux de conversion" value={`${conversionRate}%`} icon={Percent} />
        <StatTile label="Nouveaux prospects" value={String(newProspects)} icon={Users2} />
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="py-5">
          <h2 className="mb-4 text-sm font-semibold">Activité récente</h2>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune activité pour l&apos;instant.</p>
          ) : (
            <div className="flex flex-col">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 border-b border-border/60 py-3 text-sm last:border-b-0"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-xs text-primary">
                      {activity.contact.firstName[0]}
                      {activity.contact.lastName?.[0] ?? ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <span className="font-medium">
                      {activity.contact.firstName} {activity.contact.lastName}
                    </span>{" "}
                    <span className="text-muted-foreground">{activity.content}</span>
                  </div>
                  <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
                    {new Date(activity.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              ))}
            </div>
          )}
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
