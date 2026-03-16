import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Briefcase, 
  FileText, 
  CreditCard, 
  Bell, 
  CalendarDays,
  X,
  Search,
  Building2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Catálogo de Serviços", href: "/catalog", icon: Briefcase },
  { name: "Minhas Solicitações", href: "/work-orders", icon: FileText },
  { name: "Agenda", href: "/agenda", icon: CalendarDays },
  { name: "Faturas e Pagamentos", href: "/invoices", icon: CreditCard },
  { name: "Notificações", href: "/notifications", icon: Bell },
];

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const [location] = useLocation();
  const { activeProfile } = useAuth();

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-50
      w-72 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300
      ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
    `}>
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center shadow-lg shadow-primary/20">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xl font-display font-bold tracking-tight text-white block truncate">
            Cliente Portal
          </span>
        </div>
        <button className="lg:hidden" onClick={() => setMobileOpen(false)}>
          <X className="w-5 h-5 text-sidebar-foreground/70" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/40" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full bg-sidebar-accent border-transparent rounded-xl py-2 pl-9 pr-4 text-sm text-sidebar-foreground placeholder:text-sidebar-foreground/40 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <p className="px-3 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-4">
          Menu
        </p>
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          return (
            <Link key={item.name} href={item.href} className="block">
              <div 
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center px-3 py-3 rounded-xl transition-all group cursor-pointer
                  ${isActive 
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"}
                `}
              >
                <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? "text-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-accent text-primary-foreground flex items-center justify-center font-bold text-sm shadow-sm border border-primary/20 shrink-0">
            {activeProfile?.name?.substring(0, 2).toUpperCase() || "CL"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground leading-none truncate">
              {activeProfile?.name || "Cliente"}
            </p>
            <p className="text-xs text-sidebar-foreground/60 mt-1">
              {activeProfile?.companyName || "Empresa"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
