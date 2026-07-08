"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";
import { MOCK_CONTACTS, MOCK_DEALS, type DealStatus } from "@/lib/mock-data";

const COLUMNS: { status: DealStatus; label: string; dot: string }[] = [
  { status: "PROSPECT", label: "Prospect", dot: "bg-chart-3" },
  { status: "QUALIFICATION", label: "Qualification", dot: "bg-chart-2" },
  { status: "PROPOSITION", label: "Proposition", dot: "bg-primary" },
  { status: "GAGNE", label: "Gagné", dot: "bg-success" },
  { status: "PERDU", label: "Perdu", dot: "bg-destructive" },
];

export default function PipelinePage() {
  const contactsById = Object.fromEntries(MOCK_CONTACTS.map((c) => [c.id, c]));
  const totalPipeline = MOCK_DEALS.filter(
    (d) => d.status !== "PERDU",
  ).reduce((s, d) => s + d.amount, 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Pipeline commercial"
        description="Données d'exemple — le glisser-déposer sera branché en Phase 3."
        action={
          <div className="text-right">
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Valeur totale
            </div>
            <div className="text-xl font-bold tabular-nums">
              {totalPipeline.toLocaleString("fr-FR")} €
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-5">
        {COLUMNS.map((col) => {
          const deals = MOCK_DEALS.filter((d) => d.status === col.status);
          return (
            <div key={col.status} className="flex min-w-0 flex-col gap-2.5">
              <div className="flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span className={cn("h-2 w-2 rounded-full", col.dot)} />
                {col.label}
                <span className="ml-auto font-mono font-normal text-muted-foreground/70">
                  {String(deals.length).padStart(2, "0")}
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {deals.map((deal) => {
                  const contact = contactsById[deal.contactId];
                  return (
                    <Link key={deal.id} href={`/contacts/${deal.contactId}`}>
                      <Card
                        className={cn(
                          "gap-2 border-border/60 px-3.5 py-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                          col.status === "PERDU" && "opacity-60",
                        )}
                      >
                        <div className="text-sm font-medium leading-snug">{deal.title}</div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-foreground/80">
                            {deal.amount.toLocaleString("fr-FR")} €
                          </span>
                          <div className="ml-auto flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">
                              {contact?.firstName}
                            </span>
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="bg-primary/10 text-[9px] text-primary">
                                {contact?.firstName[0]}
                                {contact?.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
                {deals.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/60 py-6 text-center text-xs text-muted-foreground/50">
                    Aucune opportunité
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
