import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "./Sidebar";
import { 
  Bell,
  Menu,
  X,
  Briefcase
} from "lucide-react";
import { useState } from "react";

export function AppLayout({ children }: { children: ReactNode }) {
  const { activeProfile, isLoading } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Nenhum perfil disponível. Recarregue a página.</p>
      </div>
    );
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Briefcase },
    { name: "Meu Catálogo", href: "/catalog", icon: Briefcase },
    { name: "Ordens Atribuídas", href: "/work-orders", icon: Briefcase },
    { name: "Agenda", href: "/agenda", icon: Briefcase },
    { name: "Financeiro", href: "/financial", icon: Briefcase },
    { name: "Notificações", href: "/notifications", icon: Bell },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      {/* Mobile sidebar backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-primary/20">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-display font-bold tracking-tight text-white">ServicesHub</span>
          <button className="ml-auto lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="w-5 h-5 text-sidebar-foreground/70" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-4">
            Menu
          </p>
          <Sidebar />
        </nav>

        <div className="p-4 border-t border-sidebar-border mt-auto">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm border border-primary/20">
              {activeProfile.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{activeProfile.name}</p>
              <p className="text-xs text-sidebar-foreground/60">Prestador</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-card border-b border-border/60 z-10">
          <div className="flex items-center">
            <button className="lg:hidden mr-4 p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-display font-semibold text-foreground truncate">
              {navItems.find(n => location.startsWith(n.href))?.name || "ServicesHub"}
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/notifications" className="relative p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors inline-flex">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-card"></span>
            </Link>
            <div className="h-8 w-px bg-border/60 hidden sm:block"></div>
            <div className="hidden sm:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground leading-none">{activeProfile.name}</p>
                <p className="text-xs text-muted-foreground mt-1">Prestador</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm border border-primary/20">
                {activeProfile.name.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-muted/30 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
          <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500 relative z-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
