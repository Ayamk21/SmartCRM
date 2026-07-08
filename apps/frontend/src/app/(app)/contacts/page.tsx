"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { MOCK_CONTACTS, MOCK_DEALS } from "@/lib/mock-data";

const AVATAR_TONES = [
  "bg-primary/10 text-primary",
  "bg-ai/15 text-ai-foreground dark:text-ai",
  "bg-chart-3/15 text-chart-3",
  "bg-success/15 text-success",
];

export default function ContactsPage() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Contacts"
        description="Leads et clients (données d'exemple — le CRUD complet arrive en Phase 3)."
      />

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_CONTACTS.map((contact, i) => {
          const dealsCount = MOCK_DEALS.filter((d) => d.contactId === contact.id).length;
          return (
            <Link key={contact.id} href={`/contacts/${contact.id}`}>
              <Card className="h-full border-border/60 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <CardContent className="flex items-center gap-3 py-4">
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarFallback
                      className={`text-sm font-semibold ${AVATAR_TONES[i % AVATAR_TONES.length]}`}
                    >
                      {contact.firstName[0]}
                      {contact.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {contact.firstName} {contact.lastName}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {contact.title} · {contact.company}
                    </div>
                  </div>
                  {dealsCount > 0 && (
                    <Badge variant="secondary" className="ml-auto shrink-0 font-mono">
                      {dealsCount} deal{dealsCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
