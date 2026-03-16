import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { Bell, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Catálogo de Serviços", href: "/catalog" },
  { name: "Minhas Solicitações", href: "/work-orders" },
  { name: "Agenda", href: "/agenda" },
  { name: "Faturas e Pagamentos", href: "/invoices" },
  { name: "Notificações", href: "/notifications" },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { activeProfile } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  const pageTitle = navItems.find(n => location === n.href || location.startsWith(n.href + "/"))?.name || "Cliente Portal";

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
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-card border-b border-border/60 z-10 shrink-0">
          <div className="flex items-center min-w-0">
            <button 
              className="lg:hidden mr-3 p-2 -ml-2 rounded-lg hover:bg-muted text-muted-foreground shrink-0" 
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-xl font-display font-semibold text-foreground truncate">
              {pageTitle}
            </h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            <Link 
              href="/notifications" 
              className="relative p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors inline-flex"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-card"></span>
            </Link>
            <div className="h-8 w-px bg-border/60 hidden sm:block"></div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-foreground leading-none truncate max-w-[120px]">
                  {activeProfile?.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate max-w-[120px]">
                  {activeProfile?.companyName}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-primary to-accent text-primary-foreground flex items-center justify-center font-bold text-xs sm:text-sm shadow-sm border border-primary/20 shrink-0">
                {activeProfile?.name?.substring(0, 2).toUpperCase() || "CL"}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-muted/30 relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
          <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 animate-in fade-in duration-500 relative z-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
