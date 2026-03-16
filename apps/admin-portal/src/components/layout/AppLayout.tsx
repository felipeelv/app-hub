import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "./Sidebar";
import { Bell, Menu } from "lucide-react";

export function AppLayout({ children }: { children: ReactNode }) {
  const { adminProfile, isLoading } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!adminProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Nenhum perfil admin disponível.</p>
          <button 
            onClick={() => window.location.href = "/login"}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Ordens de Serviço", href: "/work-orders" },
    { name: "Empresas", href: "/companies" },
    { name: "Faturas", href: "/invoices" },
    { name: "Pagamentos", href: "/payments" },
    { name: "Repasses", href: "/payouts" },
    { name: "Deslocamento", href: "/travel-pricing" },
    { name: "Agenda", href: "/agenda" },
    { name: "Auditoria", href: "/audit" },
    { name: "Notificações", href: "/notifications" },
  ];

  const currentPage = navItems.find(n => location === n.href || location.startsWith(n.href + "/"))?.name || "Admin Portal";

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-card border-b border-border/60 z-10">
          <div className="flex items-center">
            <button 
              className="lg:hidden mr-4 p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground" 
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-display font-semibold text-foreground truncate">
              {currentPage}
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/notifications" className="relative p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors inline-flex">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-card"></span>
            </Link>
            <div className="h-8 w-px bg-border/60 hidden sm:block"></div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-foreground leading-none">{adminProfile.name}</p>
                <p className="text-xs text-muted-foreground mt-1">Administrador</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm border border-primary/20">
                {adminProfile.name.substring(0, 2).toUpperCase()}
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
