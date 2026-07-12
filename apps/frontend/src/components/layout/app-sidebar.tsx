"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  FileText,
  Sparkles,
  Settings,
  ChevronsUpDown,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, type AuthUser } from "@/modules/module-1-multitenant-admin/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Pipeline", href: "/pipeline", icon: KanbanSquare },
  { label: "Devis & Factures", icon: FileText },
  { label: "Copilot IA", href: "/copilot", icon: Sparkles },
  { label: "Paramètres", href: "/workspace", icon: Settings, adminOnly: true },
];

export function AppSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex items-center gap-2 px-5 pt-5 pb-6">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-ai text-xs font-bold text-primary-foreground shadow-sm">
          S
        </span>
        <span className="text-sm font-bold tracking-tight">Smart CRM Copilot</span>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {NAV_ITEMS.filter((item) => !item.adminOnly || user.role === "ADMIN").map(
          (item) => {
            const isActive =
              item.href &&
              (pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href + "/")));
            const Icon = item.icon;

            if (!item.href) {
              return (
                <span
                  key={item.label}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/40"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  <span className="ml-auto rounded-full bg-sidebar-foreground/5 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide">
                    Bientôt
                  </span>
                </span>
              );
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive &&
                    "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          },
        )}
      </nav>

      <div className="mt-auto border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-sidebar-accent">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
              {user.email[0]?.toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{user.email}</div>
              <div className="text-[10px] text-sidebar-foreground/50">
                {user.role === "ADMIN" ? "Administrateur" : "Collaborateur"}
              </div>
            </div>
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuItem variant="destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
