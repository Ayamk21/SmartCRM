import Link from "next/link";
import { ArrowLeft, Sparkles, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_ACTIVITIES, MOCK_CONTACTS, MOCK_DEALS, type DealStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<DealStatus, string> = {
  PROSPECT: "bg-chart-3/15 text-chart-3 border-transparent",
  QUALIFICATION: "bg-chart-2/15 text-chart-2 border-transparent",
  PROPOSITION: "bg-primary/15 text-primary border-transparent",
  GAGNE: "bg-success/15 text-success border-transparent",
  PERDU: "bg-destructive/15 text-destructive border-transparent",
};

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = MOCK_CONTACTS.find((c) => c.id === id);
  if (!contact) {
    notFound();
  }

  const deals = MOCK_DEALS.filter((d) => d.contactId === id);
  const activities = MOCK_ACTIVITIES.filter((a) => a.contactId === id);

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <Link
        href="/contacts"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Retour aux contacts
      </Link>

      <Card className="border-border/60 shadow-sm">
        <CardContent className="flex items-start gap-4 py-5">
          <Avatar className="h-14 w-14 shrink-0">
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {contact.firstName[0]}
              {contact.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="text-lg font-bold">
              {contact.firstName} {contact.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {contact.company} — {contact.title}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {contact.email} · {contact.phone}
            </p>
          </div>
          <div className="ml-auto flex shrink-0 gap-2">
            <Button size="sm" className="bg-ai text-ai-foreground hover:bg-ai/90">
              <Sparkles className="h-3.5 w-3.5" />
              Relance IA
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="h-3.5 w-3.5" />
              Nouveau devis
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="infos">
        <TabsList>
          <TabsTrigger value="infos">Infos</TabsTrigger>
          <TabsTrigger value="activite">Activité</TabsTrigger>
          <TabsTrigger value="devis">Devis & Factures</TabsTrigger>
        </TabsList>

        <TabsContent value="infos" className="mt-4">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="py-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Opportunités
              </h2>
              {deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune opportunité pour l&apos;instant.</p>
              ) : (
                <div className="flex flex-col">
                  {deals.map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center gap-3 border-b border-border/60 py-2.5 text-sm last:border-b-0"
                    >
                      <span>{deal.title}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {deal.amount.toLocaleString("fr-FR")} €
                      </span>
                      <Badge className={cn("ml-auto text-[10px]", STATUS_STYLE[deal.status])}>
                        {deal.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activite" className="mt-4">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="py-4">
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune activité enregistrée.</p>
              ) : (
                <div className="flex flex-col">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex gap-3 border-b border-border/60 py-2.5 last:border-b-0"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="text-sm">{activity.label}</span>
                      <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
                        {activity.date}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devis" className="mt-4">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Le module Devis &amp; Factures arrive en Phase 5.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
