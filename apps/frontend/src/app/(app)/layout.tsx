"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { useAuth } from "@/modules/module-1-multitenant-admin/lib/auth-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Chargement...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      <AppSidebar user={user} />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
