"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/modules/module-1-multitenant-admin/lib/auth-context";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    router.replace(user ? "/dashboard" : "/login");
  }, [isLoading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Chargement...
    </div>
  );
}
