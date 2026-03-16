import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  LayoutDashboard, 
  Briefcase, 
  Building2, 
  FileText, 
  CreditCard, 
  Wallet, 
  Bell, 
  ShieldAlert,
  Menu,
  X,
  Search,
  MapPin,
  ReceiptText,
  CalendarDays,
  LogOut
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Ordens de Serviço", href: "/work-orders", icon: Briefcase },
  { name: "Empresas", href: "/companies", icon: Building2 },
  { name: "Faturas", href: "/invoices", icon: ReceiptText },
  { name: "Pagamentos", href: "/payments", icon: CreditCard },
  { name: "Repasses", href: "/payouts", icon: Wallet },
  { name: "Deslocamento", href: "/travel-pricing", icon: MapPin },
  { name: "Agenda", href: "/agenda", icon: CalendarDays },
  { name: "Auditoria", href: "/audit", icon: ShieldAlert },
  { name: "Notificações", href: "/notifications", icon: Bell },
];

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const [location] = useLocation();
  const { adminProfile } = useAuth();

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
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
          <span className="text-xl font-display font-bold tracking-tight text-white">Admin Portal</span>
          <button className="ml-auto lg:hidden" onClick={onMobileClose}>
            <X className="w-5 h-5 text-sidebar-foreground/70" />
          </button>
        </div>

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

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider mb-4">
            Menu
          </p>
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(item.href + "/");
            return (
              <Link key={item.name} href={item.href} className="block">
                <div 
                  className={`
                    flex items-center px-3 py-3 rounded-xl transition-all group cursor-pointer
                    ${isActive 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"}
                  `}
                  onClick={onMobileClose}
                >
                  <item.icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? "text-primary-foreground" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"}`} />
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Admin Profile Info */}
        <div className="p-4 border-t border-sidebar-border mt-auto">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-sidebar-accent">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-sm">
                {adminProfile?.name?.substring(0, 2).toUpperCase() || "AD"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">
                {adminProfile?.name || "Admin"}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {adminProfile?.companyName || "Administrador"}
              </p>
            </div>
            <button 
              className="p-2 rounded-lg hover:bg-sidebar-primary/50 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
              title="Sair"
              onClick={() => {
                localStorage.removeItem("activeProfileId");
                window.location.href = "/login";
              }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
